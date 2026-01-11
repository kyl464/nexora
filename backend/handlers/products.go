package handlers

import (
	"net/http"
	"strconv"

	"nexora-backend/config"
	"nexora-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gosimple/slug"
)

// GetProducts returns all products with filtering and pagination
func GetProducts(c *gin.Context) {
	var products []models.Product
	query := config.DB.Preload("Category").Preload("Images")

	// Search
	if search := c.Query("search"); search != "" {
		query = query.Where("name ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Category filter
	if categoryID := c.Query("category"); categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	// Active only
	if c.Query("active") != "false" {
		query = query.Where("is_active = ?", true)
	}

	// Featured filter
	if c.Query("featured") == "true" {
		query = query.Where("is_featured = ?", true)
	}

	// Price range
	if minPrice := c.Query("min_price"); minPrice != "" {
		if price, err := strconv.ParseFloat(minPrice, 64); err == nil {
			query = query.Where("base_price >= ?", price)
		}
	}
	if maxPrice := c.Query("max_price"); maxPrice != "" {
		if price, err := strconv.ParseFloat(maxPrice, 64); err == nil {
			query = query.Where("base_price <= ?", price)
		}
	}

	// Sorting
	sortBy := c.DefaultQuery("sort", "created_at")
	order := c.DefaultQuery("order", "desc")
	query = query.Order(sortBy + " " + order)

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12"))
	offset := (page - 1) * limit

	var total int64
	config.DB.Model(&models.Product{}).Where("is_active = ?", true).Count(&total)

	query = query.Offset(offset).Limit(limit)

	if err := query.Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    total,
		"page":     page,
		"limit":    limit,
		"pages":    (total + int64(limit) - 1) / int64(limit),
	})
}

// GetProduct returns a single product by slug or ID
func GetProduct(c *gin.Context) {
	identifier := c.Param("id")

	var product models.Product
	query := config.DB.Preload("Category").Preload("Images").Preload("Variants").Preload("Reviews.User")

	// Try UUID first, then slug
	if _, err := uuid.Parse(identifier); err == nil {
		query = query.Where("id = ?", identifier)
	} else {
		query = query.Where("slug = ?", identifier)
	}

	if err := query.First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Calculate average rating
	var avgRating float64
	config.DB.Model(&models.Review{}).Where("product_id = ?", product.ID).Select("COALESCE(AVG(rating), 0)").Scan(&avgRating)

	c.JSON(http.StatusOK, gin.H{
		"product":    product,
		"avg_rating": avgRating,
	})
}

// CreateProduct creates a new product (admin only)
func CreateProduct(c *gin.Context) {
	var input struct {
		Name        string   `json:"name" binding:"required"`
		Description string   `json:"description"`
		BasePrice   float64  `json:"base_price" binding:"required"`
		CategoryID  string   `json:"category_id"`
		Stock       int      `json:"stock"`
		IsActive    bool     `json:"is_active"`
		IsFeatured  bool     `json:"is_featured"`
		Images      []string `json:"images"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product := models.Product{
		Name:        input.Name,
		Slug:        slug.Make(input.Name),
		Description: input.Description,
		BasePrice:   input.BasePrice,
		Stock:       input.Stock,
		IsActive:    input.IsActive,
		IsFeatured:  input.IsFeatured,
	}

	if input.CategoryID != "" {
		if catID, err := uuid.Parse(input.CategoryID); err == nil {
			product.CategoryID = catID
		}
	}

	if err := config.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	// Add images
	for i, url := range input.Images {
		image := models.ProductImage{
			ProductID: product.ID,
			URL:       url,
			Order:     i,
			IsPrimary: i == 0,
		}
		config.DB.Create(&image)
	}

	config.DB.Preload("Images").Preload("Category").First(&product, product.ID)
	c.JSON(http.StatusCreated, product)
}

// UpdateProduct updates a product (admin only)
func UpdateProduct(c *gin.Context) {
	id := c.Param("id")

	var product models.Product
	if err := config.DB.First(&product, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	var input struct {
		Name        string   `json:"name"`
		Description string   `json:"description"`
		BasePrice   float64  `json:"base_price"`
		CategoryID  string   `json:"category_id"`
		Stock       int      `json:"stock"`
		IsActive    *bool    `json:"is_active"`
		IsFeatured  *bool    `json:"is_featured"`
		Images      []string `json:"images"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name != "" {
		product.Name = input.Name
		product.Slug = slug.Make(input.Name)
	}
	if input.Description != "" {
		product.Description = input.Description
	}
	if input.BasePrice > 0 {
		product.BasePrice = input.BasePrice
	}
	if input.CategoryID != "" {
		if catID, err := uuid.Parse(input.CategoryID); err == nil {
			product.CategoryID = catID
		}
	}
	if input.Stock >= 0 {
		product.Stock = input.Stock
	}
	if input.IsActive != nil {
		product.IsActive = *input.IsActive
	}
	if input.IsFeatured != nil {
		product.IsFeatured = *input.IsFeatured
	}

	if err := config.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	// Update images if provided
	if len(input.Images) > 0 {
		config.DB.Where("product_id = ?", product.ID).Delete(&models.ProductImage{})
		for i, url := range input.Images {
			image := models.ProductImage{
				ProductID: product.ID,
				URL:       url,
				Order:     i,
				IsPrimary: i == 0,
			}
			config.DB.Create(&image)
		}
	}

	config.DB.Preload("Images").Preload("Category").First(&product, product.ID)
	c.JSON(http.StatusOK, product)
}

// DeleteProduct soft deletes a product (admin only)
func DeleteProduct(c *gin.Context) {
	id := c.Param("id")

	var product models.Product
	if err := config.DB.First(&product, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	if err := config.DB.Delete(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// GetCategories returns all categories
func GetCategories(c *gin.Context) {
	var categories []models.Category
	if err := config.DB.Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}
	c.JSON(http.StatusOK, categories)
}

// CreateCategory creates a new category (admin only)
func CreateCategory(c *gin.Context) {
	var input struct {
		Name string `json:"name" binding:"required"`
		Icon string `json:"icon"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category := models.Category{
		Name: input.Name,
		Slug: slug.Make(input.Name),
		Icon: input.Icon,
	}

	if err := config.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	c.JSON(http.StatusCreated, category)
}

// UpdateCategory updates a category (admin only)
func UpdateCategory(c *gin.Context) {
	id := c.Param("id")

	var category models.Category
	if err := config.DB.First(&category, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	var input struct {
		Name string `json:"name"`
		Icon string `json:"icon"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name != "" {
		category.Name = input.Name
		category.Slug = slug.Make(input.Name)
	}
	if input.Icon != "" {
		category.Icon = input.Icon
	}

	if err := config.DB.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}

	c.JSON(http.StatusOK, category)
}

// DeleteCategory soft deletes a category (admin only)
func DeleteCategory(c *gin.Context) {
	id := c.Param("id")

	var category models.Category
	if err := config.DB.First(&category, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	if err := config.DB.Delete(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}
