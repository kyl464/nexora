package handlers

import (
	"net/http"

	"nexora-backend/config"
	"nexora-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetCart returns the user's cart items
func GetCart(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var cartItems []models.CartItem
	if err := config.DB.Preload("Product.Images").Preload("Variant").
		Where("user_id = ?", userID).Find(&cartItems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cart"})
		return
	}

	// Calculate totals
	var subtotal float64
	for _, item := range cartItems {
		price := item.Product.BasePrice
		if item.Variant != nil {
			price += item.Variant.PriceModifier
		}
		subtotal += price * float64(item.Quantity)
	}

	c.JSON(http.StatusOK, gin.H{
		"items":    cartItems,
		"subtotal": subtotal,
		"count":    len(cartItems),
	})
}

// AddToCart adds an item to the cart
func AddToCart(c *gin.Context) {
	userID, _ := c.Get("user_id")
	parsedUserID, _ := uuid.Parse(userID.(string))

	var input struct {
		ProductID string `json:"product_id" binding:"required"`
		VariantID string `json:"variant_id"`
		Quantity  int    `json:"quantity"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productID, err := uuid.Parse(input.ProductID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Verify product exists and is active
	var product models.Product
	if err := config.DB.First(&product, "id = ? AND is_active = ?", productID, true).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	quantity := input.Quantity
	if quantity <= 0 {
		quantity = 1
	}

	// Check if item already in cart
	var existingItem models.CartItem
	query := config.DB.Where("user_id = ? AND product_id = ?", parsedUserID, productID)

	var variantID *uuid.UUID
	if input.VariantID != "" {
		vid, _ := uuid.Parse(input.VariantID)
		variantID = &vid
		query = query.Where("variant_id = ?", variantID)
	} else {
		query = query.Where("variant_id IS NULL")
	}

	if err := query.First(&existingItem).Error; err == nil {
		// Update quantity
		existingItem.Quantity += quantity
		if err := config.DB.Save(&existingItem).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart"})
			return
		}
		c.JSON(http.StatusOK, existingItem)
		return
	}

	// Create new cart item
	cartItem := models.CartItem{
		UserID:    parsedUserID,
		ProductID: productID,
		VariantID: variantID,
		Quantity:  quantity,
	}

	if err := config.DB.Create(&cartItem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to cart"})
		return
	}

	config.DB.Preload("Product.Images").First(&cartItem, cartItem.ID)
	c.JSON(http.StatusCreated, cartItem)
}

// UpdateCartItem updates the quantity of a cart item
func UpdateCartItem(c *gin.Context) {
	userID, _ := c.Get("user_id")
	itemID := c.Param("id")

	var cartItem models.CartItem
	if err := config.DB.Where("id = ? AND user_id = ?", itemID, userID).First(&cartItem).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cart item not found"})
		return
	}

	var input struct {
		Quantity int `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cartItem.Quantity = input.Quantity
	if err := config.DB.Save(&cartItem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart"})
		return
	}

	c.JSON(http.StatusOK, cartItem)
}

// RemoveFromCart removes an item from the cart
func RemoveFromCart(c *gin.Context) {
	userID, _ := c.Get("user_id")
	itemID := c.Param("id")

	var cartItem models.CartItem
	if err := config.DB.Where("id = ? AND user_id = ?", itemID, userID).First(&cartItem).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cart item not found"})
		return
	}

	if err := config.DB.Delete(&cartItem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item removed from cart"})
}

// ClearCart removes all items from the cart
func ClearCart(c *gin.Context) {
	userID, _ := c.Get("user_id")

	if err := config.DB.Where("user_id = ?", userID).Delete(&models.CartItem{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart cleared"})
}

// GetWishlist returns the user's wishlist items
func GetWishlist(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var items []models.WishlistItem
	if err := config.DB.Preload("Product.Images").Where("user_id = ?", userID).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch wishlist"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// AddToWishlist adds a product to the wishlist
func AddToWishlist(c *gin.Context) {
	userID, _ := c.Get("user_id")
	parsedUserID, _ := uuid.Parse(userID.(string))

	var input struct {
		ProductID string `json:"product_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productID, err := uuid.Parse(input.ProductID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Check if already in wishlist
	var existing models.WishlistItem
	if err := config.DB.Where("user_id = ? AND product_id = ?", parsedUserID, productID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Product already in wishlist"})
		return
	}

	item := models.WishlistItem{
		UserID:    parsedUserID,
		ProductID: productID,
	}

	if err := config.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to wishlist"})
		return
	}

	config.DB.Preload("Product.Images").First(&item, item.ID)
	c.JSON(http.StatusCreated, item)
}

// RemoveFromWishlist removes a product from the wishlist
func RemoveFromWishlist(c *gin.Context) {
	userID, _ := c.Get("user_id")
	productID := c.Param("product_id")

	var item models.WishlistItem
	if err := config.DB.Where("user_id = ? AND product_id = ?", userID, productID).First(&item).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found in wishlist"})
		return
	}

	if err := config.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from wishlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from wishlist"})
}
