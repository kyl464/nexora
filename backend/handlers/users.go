package handlers

import (
	"net/http"
	"strconv"

	"nexora-backend/config"
	"nexora-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetProfile returns the current user's profile
func GetProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user models.User
	if err := config.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateProfile updates the current user's profile
func UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user models.User
	if err := config.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var input struct {
		Name   string `json:"name"`
		Avatar string `json:"avatar"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name != "" {
		user.Name = input.Name
	}
	if input.Avatar != "" {
		user.Avatar = input.Avatar
	}

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// GetAddresses returns user's addresses
func GetAddresses(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var addresses []models.Address
	if err := config.DB.Where("user_id = ?", userID).Find(&addresses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch addresses"})
		return
	}

	c.JSON(http.StatusOK, addresses)
}

// CreateAddress creates a new address
func CreateAddress(c *gin.Context) {
	userID, _ := c.Get("user_id")
	parsedUserID, _ := uuid.Parse(userID.(string))

	var input struct {
		Label      string `json:"label" binding:"required"`
		Name       string `json:"name" binding:"required"`
		Phone      string `json:"phone" binding:"required"`
		Street     string `json:"street" binding:"required"`
		City       string `json:"city" binding:"required"`
		State      string `json:"state" binding:"required"`
		PostalCode string `json:"postal_code" binding:"required"`
		Country    string `json:"country"`
		IsDefault  bool   `json:"is_default"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If this is the default, unset other defaults
	if input.IsDefault {
		config.DB.Model(&models.Address{}).Where("user_id = ?", parsedUserID).Update("is_default", false)
	}

	country := input.Country
	if country == "" {
		country = "Indonesia"
	}

	address := models.Address{
		UserID:     parsedUserID,
		Label:      input.Label,
		Name:       input.Name,
		Phone:      input.Phone,
		Street:     input.Street,
		City:       input.City,
		State:      input.State,
		PostalCode: input.PostalCode,
		Country:    country,
		IsDefault:  input.IsDefault,
	}

	if err := config.DB.Create(&address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create address"})
		return
	}

	c.JSON(http.StatusCreated, address)
}

// UpdateAddress updates an address
func UpdateAddress(c *gin.Context) {
	userID, _ := c.Get("user_id")
	addressID := c.Param("id")

	var address models.Address
	if err := config.DB.Where("id = ? AND user_id = ?", addressID, userID).First(&address).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
		return
	}

	var input struct {
		Label      string `json:"label"`
		Name       string `json:"name"`
		Phone      string `json:"phone"`
		Street     string `json:"street"`
		City       string `json:"city"`
		State      string `json:"state"`
		PostalCode string `json:"postal_code"`
		Country    string `json:"country"`
		IsDefault  *bool  `json:"is_default"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Label != "" {
		address.Label = input.Label
	}
	if input.Name != "" {
		address.Name = input.Name
	}
	if input.Phone != "" {
		address.Phone = input.Phone
	}
	if input.Street != "" {
		address.Street = input.Street
	}
	if input.City != "" {
		address.City = input.City
	}
	if input.State != "" {
		address.State = input.State
	}
	if input.PostalCode != "" {
		address.PostalCode = input.PostalCode
	}
	if input.Country != "" {
		address.Country = input.Country
	}
	if input.IsDefault != nil && *input.IsDefault {
		config.DB.Model(&models.Address{}).Where("user_id = ?", userID).Update("is_default", false)
		address.IsDefault = true
	}

	if err := config.DB.Save(&address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address"})
		return
	}

	c.JSON(http.StatusOK, address)
}

// DeleteAddress deletes an address
func DeleteAddress(c *gin.Context) {
	userID, _ := c.Get("user_id")
	addressID := c.Param("id")

	var address models.Address
	if err := config.DB.Where("id = ? AND user_id = ?", addressID, userID).First(&address).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
		return
	}

	if err := config.DB.Delete(&address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete address"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Address deleted"})
}

// CreateReview creates a product review
func CreateReview(c *gin.Context) {
	userID, _ := c.Get("user_id")
	parsedUserID, _ := uuid.Parse(userID.(string))

	var input struct {
		ProductID string `json:"product_id" binding:"required"`
		Rating    int    `json:"rating" binding:"required,min=1,max=5"`
		Comment   string `json:"comment"`
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

	// Check if user already reviewed this product
	var existing models.Review
	if err := config.DB.Where("user_id = ? AND product_id = ?", parsedUserID, productID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already reviewed this product"})
		return
	}

	review := models.Review{
		UserID:    parsedUserID,
		ProductID: productID,
		Rating:    input.Rating,
		Comment:   input.Comment,
	}

	if err := config.DB.Create(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	config.DB.Preload("User").First(&review, review.ID)
	c.JSON(http.StatusCreated, review)
}

// Admin handlers

// GetAllUsers returns all users (admin only)
func GetAllUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	var users []models.User
	var total int64

	config.DB.Model(&models.User{}).Count(&total)

	if err := config.DB.Order("created_at desc").Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": total,
		"page":  page,
		"limit": limit,
		"pages": (total + int64(limit) - 1) / int64(limit),
	})
}

// UpdateUserRole updates a user's role (admin only)
func UpdateUserRole(c *gin.Context) {
	targetUserID := c.Param("id")

	var user models.User
	if err := config.DB.First(&user, "id = ?", targetUserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var input struct {
		Role string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Role != "customer" && input.Role != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	user.Role = input.Role
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// GetDashboardStats returns dashboard statistics (admin only)
func GetDashboardStats(c *gin.Context) {
	var totalUsers int64
	var totalProducts int64
	var totalOrders int64
	var totalRevenue float64
	var pendingOrders int64

	config.DB.Model(&models.User{}).Count(&totalUsers)
	config.DB.Model(&models.Product{}).Where("is_active = ?", true).Count(&totalProducts)
	config.DB.Model(&models.Order{}).Count(&totalOrders)
	config.DB.Model(&models.Order{}).Where("status IN ?", []string{"paid", "processing", "shipped", "delivered"}).
		Select("COALESCE(SUM(total), 0)").Scan(&totalRevenue)
	config.DB.Model(&models.Order{}).Where("status = ?", "pending").Count(&pendingOrders)

	// Recent orders
	var recentOrders []models.Order
	config.DB.Preload("User").Order("created_at desc").Limit(5).Find(&recentOrders)

	c.JSON(http.StatusOK, gin.H{
		"total_users":    totalUsers,
		"total_products": totalProducts,
		"total_orders":   totalOrders,
		"total_revenue":  totalRevenue,
		"pending_orders": pendingOrders,
		"recent_orders":  recentOrders,
	})
}
