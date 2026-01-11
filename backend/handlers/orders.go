package handlers

import (
	"fmt"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

	"nexora-backend/config"
	"nexora-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GenerateOrderNumber creates a unique order number from name initials
func GenerateOrderNumber(name string) string {
	// Extract initials (up to 3 characters)
	words := strings.Fields(name)
	initials := ""
	for _, word := range words {
		if len(word) > 0 && len(initials) < 3 {
			initials += strings.ToUpper(string(word[0]))
		}
	}
	if len(initials) == 0 {
		initials = "ORD"
	}
	// Add random number
	rand.Seed(time.Now().UnixNano())
	randomNum := rand.Intn(900000) + 100000 // 6 digit number
	return fmt.Sprintf("%s-%d", initials, randomNum)
}

// CreateOrder creates a new order from the cart (logged-in user)
func CreateOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	parsedUserID, _ := uuid.Parse(userID.(string))

	var input struct {
		AddressID string `json:"address_id" binding:"required"`
		Notes     string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	addressID, err := uuid.Parse(input.AddressID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid address ID"})
		return
	}

	// Verify address belongs to user
	var address models.Address
	if err := config.DB.Where("id = ? AND user_id = ?", addressID, parsedUserID).First(&address).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
		return
	}

	// Get user for order number
	var user models.User
	config.DB.First(&user, "id = ?", parsedUserID)

	// Get cart items
	var cartItems []models.CartItem
	if err := config.DB.Preload("Product").Preload("Variant").
		Where("user_id = ?", parsedUserID).Find(&cartItems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cart"})
		return
	}

	if len(cartItems) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cart is empty"})
		return
	}

	// Calculate totals and check stock
	var subtotal float64
	var orderItems []models.OrderItem

	for _, item := range cartItems {
		// Check stock
		if item.Product.Stock < item.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Insufficient stock for %s", item.Product.Name)})
			return
		}

		price := item.Product.BasePrice
		variantInfo := ""
		if item.Variant != nil {
			price += item.Variant.PriceModifier
			variantInfo = item.Variant.Name + ": " + item.Variant.Value
		}
		itemSubtotal := price * float64(item.Quantity)
		subtotal += itemSubtotal

		orderItems = append(orderItems, models.OrderItem{
			ProductID:   item.ProductID,
			VariantID:   item.VariantID,
			ProductName: item.Product.Name,
			VariantInfo: variantInfo,
			Price:       price,
			Quantity:    item.Quantity,
			Subtotal:    itemSubtotal,
		})
	}

	shippingFee := 15000.0
	if subtotal > 500000 {
		shippingFee = 0
	}
	total := subtotal + shippingFee

	// Create order
	order := models.Order{
		OrderNumber: GenerateOrderNumber(user.Name),
		UserID:      &parsedUserID,
		AddressID:   &addressID,
		Status:      models.OrderStatusPending,
		Subtotal:    subtotal,
		ShippingFee: shippingFee,
		Total:       total,
		Notes:       input.Notes,
	}

	tx := config.DB.Begin()

	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// Create order items and reserve stock
	for i := range orderItems {
		orderItems[i].OrderID = order.ID
		if err := tx.Create(&orderItems[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order items"})
			return
		}

		// Reserve stock
		if err := tx.Model(&models.Product{}).Where("id = ?", orderItems[i].ProductID).
			Update("stock", config.DB.Raw("stock - ?", orderItems[i].Quantity)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reserve stock"})
			return
		}
	}

	// Clear cart
	if err := tx.Where("user_id = ?", parsedUserID).Delete(&models.CartItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear cart"})
		return
	}

	tx.Commit()

	config.DB.Preload("Items").Preload("Address").First(&order, order.ID)
	c.JSON(http.StatusCreated, order)
}

// CreateGuestOrder creates an order for guest checkout
func CreateGuestOrder(c *gin.Context) {
	var input struct {
		GuestEmail   string `json:"guest_email" binding:"required,email"`
		GuestName    string `json:"guest_name" binding:"required"`
		GuestPhone   string `json:"guest_phone" binding:"required"`
		GuestAddress string `json:"guest_address" binding:"required"`
		Notes        string `json:"notes"`
		Items        []struct {
			ProductID string `json:"product_id" binding:"required"`
			VariantID string `json:"variant_id"`
			Quantity  int    `json:"quantity" binding:"required,min=1"`
		} `json:"items" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calculate totals and verify stock
	var subtotal float64
	var orderItems []models.OrderItem

	for _, item := range input.Items {
		productID, err := uuid.Parse(item.ProductID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
			return
		}

		var product models.Product
		if err := config.DB.First(&product, "id = ?", productID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}

		// Check stock
		if product.Stock < item.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Insufficient stock for %s", product.Name)})
			return
		}

		price := product.BasePrice
		variantInfo := ""
		var variantID *uuid.UUID

		if item.VariantID != "" {
			parsedVariantID, err := uuid.Parse(item.VariantID)
			if err == nil {
				var variant models.ProductVariant
				if config.DB.First(&variant, "id = ?", parsedVariantID).Error == nil {
					price += variant.PriceModifier
					variantInfo = variant.Name + ": " + variant.Value
					variantID = &parsedVariantID
				}
			}
		}

		itemSubtotal := price * float64(item.Quantity)
		subtotal += itemSubtotal

		orderItems = append(orderItems, models.OrderItem{
			ProductID:   productID,
			VariantID:   variantID,
			ProductName: product.Name,
			VariantInfo: variantInfo,
			Price:       price,
			Quantity:    item.Quantity,
			Subtotal:    itemSubtotal,
		})
	}

	shippingFee := 15000.0
	if subtotal > 500000 {
		shippingFee = 0
	}
	total := subtotal + shippingFee

	// Create order
	order := models.Order{
		OrderNumber:  GenerateOrderNumber(input.GuestName),
		Status:       models.OrderStatusPending,
		Subtotal:     subtotal,
		ShippingFee:  shippingFee,
		Total:        total,
		Notes:        input.Notes,
		GuestEmail:   input.GuestEmail,
		GuestName:    input.GuestName,
		GuestPhone:   input.GuestPhone,
		GuestAddress: input.GuestAddress,
	}

	tx := config.DB.Begin()

	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// Create order items and reserve stock
	for i := range orderItems {
		orderItems[i].OrderID = order.ID
		if err := tx.Create(&orderItems[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order items"})
			return
		}

		// Reserve stock
		if err := tx.Model(&models.Product{}).Where("id = ?", orderItems[i].ProductID).
			Update("stock", config.DB.Raw("stock - ?", orderItems[i].Quantity)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reserve stock"})
			return
		}
	}

	tx.Commit()

	config.DB.Preload("Items").First(&order, order.ID)
	c.JSON(http.StatusCreated, order)
}

// TrackOrder allows guest to track their order
func TrackOrder(c *gin.Context) {
	var input struct {
		OrderNumber string `json:"order_number" binding:"required"`
		Email       string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var order models.Order
	if err := config.DB.Preload("Items.Product.Images").Preload("Payment").
		Where("order_number = ? AND guest_email = ?", input.OrderNumber, input.Email).
		First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// GetOrders returns user's orders
func GetOrders(c *gin.Context) {
	userID, _ := c.Get("user_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var orders []models.Order
	var total int64

	config.DB.Model(&models.Order{}).Where("user_id = ?", userID).Count(&total)

	if err := config.DB.Preload("Items.Product.Images").Preload("Payment").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Offset(offset).Limit(limit).
		Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"total":  total,
		"page":   page,
		"limit":  limit,
		"pages":  (total + int64(limit) - 1) / int64(limit),
	})
}

// GetOrder returns a single order
func GetOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	orderID := c.Param("id")

	var order models.Order
	query := config.DB.Preload("Items.Product.Images").Preload("Address").Preload("Payment").Preload("User").
		Where("id = ?", orderID)

	// Non-admin can only see their own orders
	role, _ := c.Get("role")
	if role != "admin" {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// CancelOrder cancels an order and restores stock
func CancelOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	orderID := c.Param("id")

	var order models.Order
	if err := config.DB.Preload("Items").Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	if order.Status != models.OrderStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only pending orders can be cancelled"})
		return
	}

	tx := config.DB.Begin()

	// Restore stock
	for _, item := range order.Items {
		if err := tx.Model(&models.Product{}).Where("id = ?", item.ProductID).
			Update("stock", config.DB.Raw("stock + ?", item.Quantity)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restore stock"})
			return
		}
	}

	order.Status = models.OrderStatusCancelled
	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel order"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, order)
}

// GetAllOrders returns all orders (admin only)
func GetAllOrders(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	status := c.Query("status")

	var orders []models.Order
	var total int64

	query := config.DB.Model(&models.Order{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	query.Count(&total)

	query = config.DB.Preload("User").Preload("Items.Product").Preload("Payment").Preload("Address")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("created_at desc").
		Offset(offset).Limit(limit).
		Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"total":  total,
		"page":   page,
		"limit":  limit,
		"pages":  (total + int64(limit) - 1) / int64(limit),
	})
}

// AdminGetOrderDetail returns full order details for admin
func AdminGetOrderDetail(c *gin.Context) {
	orderID := c.Param("id")

	var order models.Order
	if err := config.DB.Preload("Items.Product.Images").Preload("Address").Preload("Payment").Preload("User").
		First(&order, "id = ?", orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// UpdateOrderStatus updates order status (admin only)
func UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")

	var order models.Order
	if err := config.DB.Preload("Items").First(&order, "id = ?", orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	var input struct {
		Status         string `json:"status" binding:"required"`
		TrackingNumber string `json:"tracking_number"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newStatus := models.OrderStatus(input.Status)
	oldStatus := order.Status

	// Update tracking number if provided
	if input.TrackingNumber != "" {
		order.TrackingNumber = input.TrackingNumber
	}

	// Set timestamps based on status
	now := time.Now()
	if newStatus == models.OrderStatusShipped && oldStatus != models.OrderStatusShipped {
		order.ShippedAt = &now
	}
	if newStatus == models.OrderStatusDelivered && oldStatus != models.OrderStatusDelivered {
		order.DeliveredAt = &now
	}

	// If cancelling, restore stock
	if newStatus == models.OrderStatusCancelled && oldStatus != models.OrderStatusCancelled {
		tx := config.DB.Begin()
		for _, item := range order.Items {
			if err := tx.Model(&models.Product{}).Where("id = ?", item.ProductID).
				Update("stock", config.DB.Raw("stock + ?", item.Quantity)).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restore stock"})
				return
			}
		}
		tx.Commit()
	}

	order.Status = newStatus
	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}

	c.JSON(http.StatusOK, order)
}
