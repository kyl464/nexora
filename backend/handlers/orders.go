package handlers

import (
	"net/http"
	"strconv"

	"nexora-backend/config"
	"nexora-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateOrder creates a new order from the cart
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

	// Calculate totals
	var subtotal float64
	var orderItems []models.OrderItem

	for _, item := range cartItems {
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

	shippingFee := 15000.0 // Fixed shipping for now
	total := subtotal + shippingFee

	// Create order
	order := models.Order{
		UserID:      parsedUserID,
		AddressID:   addressID,
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

	// Create order items
	for i := range orderItems {
		orderItems[i].OrderID = order.ID
		if err := tx.Create(&orderItems[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order items"})
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
	query := config.DB.Preload("Items.Product.Images").Preload("Address").Preload("Payment").
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

// CancelOrder cancels an order
func CancelOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	orderID := c.Param("id")

	var order models.Order
	if err := config.DB.Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	if order.Status != models.OrderStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only pending orders can be cancelled"})
		return
	}

	order.Status = models.OrderStatusCancelled
	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel order"})
		return
	}

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

	query = config.DB.Preload("User").Preload("Items").Preload("Payment")
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

// UpdateOrderStatus updates order status (admin only)
func UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")

	var order models.Order
	if err := config.DB.First(&order, "id = ?", orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	var input struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order.Status = models.OrderStatus(input.Status)
	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}

	c.JSON(http.StatusOK, order)
}
