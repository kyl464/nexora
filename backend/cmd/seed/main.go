package main

import (
	"log"

	"nexora-backend/config"
	"nexora-backend/models"

	"github.com/google/uuid"
)

func main() {
	config.Load()
	config.InitDatabase()

	// Auto-migrate models to ensure tables exist
	config.DB.AutoMigrate(
		&models.User{},
		&models.Address{},
		&models.Category{},
		&models.Product{},
		&models.ProductImage{},
		&models.ProductVariant{},
		&models.Review{},
		&models.CartItem{},
		&models.WishlistItem{},
		&models.Order{},
		&models.OrderItem{},
		&models.Payment{},
	)

	log.Println("Seeding database...")

	// Create categories
	categories := []models.Category{
		{Name: "Electronics", Slug: "electronics", Icon: "laptop"},
		{Name: "Fashion", Slug: "fashion", Icon: "shirt"},
		{Name: "Home & Living", Slug: "home-living", Icon: "home"},
		{Name: "Sports", Slug: "sports", Icon: "trophy"},
		{Name: "Books", Slug: "books", Icon: "book-open"},
		{Name: "Beauty", Slug: "beauty", Icon: "sparkles"},
	}

	for i := range categories {
		config.DB.FirstOrCreate(&categories[i], models.Category{Slug: categories[i].Slug})
	}
	log.Println("✓ Categories seeded")

	// Create products
	products := []struct {
		product  models.Product
		images   []string
		variants []struct {
			name  string
			value string
			price float64
			stock int
		}
	}{
		{
			product: models.Product{
				Name:        "MacBook Pro 14\"",
				Slug:        "macbook-pro-14",
				Description: "Apple M3 Pro chip, 18GB RAM, 512GB SSD. The most advanced Mac lineup ever. Experience blazing-fast performance with the new M3 Pro chip.",
				BasePrice:   28999000,
				Stock:       15,
				IsActive:    true,
				IsFeatured:  true,
			},
			images: []string{
				"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
				"https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800",
			},
			variants: []struct {
				name  string
				value string
				price float64
				stock int
			}{
				{"Storage", "512GB", 0, 10},
				{"Storage", "1TB", 3000000, 5},
			},
		},
		{
			product: models.Product{
				Name:        "Sony WH-1000XM5",
				Slug:        "sony-wh-1000xm5",
				Description: "Industry-leading noise canceling headphones with Auto NC Optimizer, crystal-clear hands-free calling, and up to 30-hour battery life.",
				BasePrice:   5499000,
				Stock:       25,
				IsActive:    true,
				IsFeatured:  true,
			},
			images: []string{
				"https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800",
				"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
			},
			variants: []struct {
				name  string
				value string
				price float64
				stock int
			}{
				{"Color", "Black", 0, 15},
				{"Color", "Silver", 0, 10},
			},
		},
		{
			product: models.Product{
				Name:        "iPhone 15 Pro Max",
				Slug:        "iphone-15-pro-max",
				Description: "Titanium design. A17 Pro chip. The most powerful iPhone camera system. Action button. All in a beautiful new design.",
				BasePrice:   21999000,
				Stock:       20,
				IsActive:    true,
				IsFeatured:  true,
			},
			images: []string{
				"https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800",
				"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800",
			},
			variants: []struct {
				name  string
				value string
				price float64
				stock int
			}{
				{"Storage", "256GB", 0, 8},
				{"Storage", "512GB", 2000000, 7},
				{"Storage", "1TB", 4000000, 5},
			},
		},
		{
			product: models.Product{
				Name:        "Premium Cotton T-Shirt",
				Slug:        "premium-cotton-tshirt",
				Description: "Ultra-soft 100% organic cotton t-shirt. Perfect for everyday wear with a modern relaxed fit.",
				BasePrice:   299000,
				Stock:       100,
				IsActive:    true,
				IsFeatured:  false,
			},
			images: []string{
				"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
				"https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800",
			},
			variants: []struct {
				name  string
				value string
				price float64
				stock int
			}{
				{"Size", "S", 0, 20},
				{"Size", "M", 0, 30},
				{"Size", "L", 0, 30},
				{"Size", "XL", 0, 20},
			},
		},
		{
			product: models.Product{
				Name:        "Nike Air Max 270",
				Slug:        "nike-air-max-270",
				Description: "The Nike Air Max 270 delivers visible cushioning under every step. Updated for modern comfort while keeping the classic look.",
				BasePrice:   2199000,
				Stock:       50,
				IsActive:    true,
				IsFeatured:  true,
			},
			images: []string{
				"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
				"https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800",
			},
			variants: []struct {
				name  string
				value string
				price float64
				stock int
			}{
				{"Size", "40", 0, 10},
				{"Size", "41", 0, 10},
				{"Size", "42", 0, 15},
				{"Size", "43", 0, 10},
				{"Size", "44", 0, 5},
			},
		},
		{
			product: models.Product{
				Name:        "Smart Watch Pro",
				Slug:        "smart-watch-pro",
				Description: "Advanced health monitoring, GPS, water resistant to 50m. Track your fitness journey with precision.",
				BasePrice:   3499000,
				Stock:       30,
				IsActive:    true,
				IsFeatured:  true,
			},
			images: []string{
				"https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800",
				"https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800",
			},
			variants: []struct {
				name  string
				value string
				price float64
				stock int
			}{
				{"Band", "Silicone", 0, 15},
				{"Band", "Leather", 200000, 10},
				{"Band", "Metal", 400000, 5},
			},
		},
		{
			product: models.Product{
				Name:        "Minimalist Desk Lamp",
				Slug:        "minimalist-desk-lamp",
				Description: "LED desk lamp with adjustable brightness and color temperature. Perfect for your home office setup.",
				BasePrice:   599000,
				Stock:       40,
				IsActive:    true,
				IsFeatured:  false,
			},
			images: []string{
				"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
			},
			variants: []struct {
				name  string
				value string
				price float64
				stock int
			}{
				{"Color", "White", 0, 20},
				{"Color", "Black", 0, 20},
			},
		},
		{
			product: models.Product{
				Name:        "Wireless Keyboard & Mouse Combo",
				Slug:        "wireless-keyboard-mouse",
				Description: "Ergonomic wireless keyboard and mouse combo. Silent keys, long battery life, and comfortable design.",
				BasePrice:   899000,
				Stock:       35,
				IsActive:    true,
				IsFeatured:  false,
			},
			images: []string{
				"https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
			},
			variants: nil,
		},
	}

	// Assign categories
	var electronicsID, fashionID, homeID, sportsID uuid.UUID
	for _, cat := range categories {
		switch cat.Slug {
		case "electronics":
			electronicsID = cat.ID
		case "fashion":
			fashionID = cat.ID
		case "home-living":
			homeID = cat.ID
		case "sports":
			sportsID = cat.ID
		}
	}

	categoryMap := map[string]uuid.UUID{
		"macbook-pro-14":          electronicsID,
		"sony-wh-1000xm5":         electronicsID,
		"iphone-15-pro-max":       electronicsID,
		"premium-cotton-tshirt":   fashionID,
		"nike-air-max-270":        sportsID,
		"smart-watch-pro":         electronicsID,
		"minimalist-desk-lamp":    homeID,
		"wireless-keyboard-mouse": electronicsID,
	}

	for _, p := range products {
		p.product.CategoryID = categoryMap[p.product.Slug]

		var existing models.Product
		if err := config.DB.Where("slug = ?", p.product.Slug).First(&existing).Error; err != nil {
			config.DB.Create(&p.product)

			// Add images
			for i, url := range p.images {
				img := models.ProductImage{
					ProductID: p.product.ID,
					URL:       url,
					Order:     i,
					IsPrimary: i == 0,
				}
				config.DB.Create(&img)
			}

			// Add variants
			for _, v := range p.variants {
				variant := models.ProductVariant{
					ProductID:     p.product.ID,
					Name:          v.name,
					Value:         v.value,
					PriceModifier: v.price,
					Stock:         v.stock,
				}
				config.DB.Create(&variant)
			}
		}
	}
	log.Println("✓ Products seeded")

	// Create admin user
	googleID := "admin-seed-account"
	adminUser := models.User{
		Email:    "admin@nexora.com",
		Name:     "Admin Nexora",
		Role:     "admin",
		GoogleID: &googleID,
	}
	config.DB.FirstOrCreate(&adminUser, models.User{Email: adminUser.Email})
	log.Println("✓ Admin user seeded")

	log.Println("✅ Database seeding completed!")
}
