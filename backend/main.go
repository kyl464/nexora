package main

import (
	"log"

	"nexora-backend/config"
	"nexora-backend/handlers"
	"nexora-backend/middleware"
	"nexora-backend/models"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db := config.InitDatabase()

	// Auto-migrate models
	db.AutoMigrate(
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

	// Initialize OAuth
	handlers.InitOAuth()

	// Setup Gin router
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Middleware
	r.Use(middleware.CORSMiddleware())

	// API routes
	api := r.Group("/api")
	{
		// Public routes
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok", "message": "Nexora API is running"})
		})

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.GET("/google", handlers.GoogleLogin)
			auth.GET("/google/callback", handlers.GoogleCallback)
			auth.GET("/me", middleware.AuthMiddleware(), handlers.GetMe)
			auth.POST("/refresh", middleware.AuthMiddleware(), handlers.RefreshToken)
		}

		// Products routes (public)
		products := api.Group("/products")
		{
			products.GET("", handlers.GetProducts)
			products.GET("/:id", handlers.GetProduct)
		}

		// Categories routes (public)
		categories := api.Group("/categories")
		{
			categories.GET("", handlers.GetCategories)
		}

		// Cart routes (authenticated)
		cart := api.Group("/cart")
		cart.Use(middleware.AuthMiddleware())
		{
			cart.GET("", handlers.GetCart)
			cart.POST("", handlers.AddToCart)
			cart.PUT("/:id", handlers.UpdateCartItem)
			cart.DELETE("/:id", handlers.RemoveFromCart)
			cart.DELETE("", handlers.ClearCart)
		}

		// Wishlist routes (authenticated)
		wishlist := api.Group("/wishlist")
		wishlist.Use(middleware.AuthMiddleware())
		{
			wishlist.GET("", handlers.GetWishlist)
			wishlist.POST("", handlers.AddToWishlist)
			wishlist.DELETE("/:product_id", handlers.RemoveFromWishlist)
		}

		// Orders routes (authenticated)
		orders := api.Group("/orders")
		orders.Use(middleware.AuthMiddleware())
		{
			orders.GET("", handlers.GetOrders)
			orders.POST("", handlers.CreateOrder)
			orders.GET("/:id", handlers.GetOrder)
			orders.POST("/:id/cancel", handlers.CancelOrder)
		}

		// Payment routes
		payments := api.Group("/payments")
		{
			payments.POST("/notification", handlers.PaymentNotification)
			payments.POST("/:order_id", middleware.AuthMiddleware(), handlers.CreatePayment)
			payments.GET("/:order_id/status", middleware.AuthMiddleware(), handlers.GetPaymentStatus)
			payments.POST("/:order_id/simulate", middleware.AuthMiddleware(), handlers.SimulatePayment)
		}

		// User routes (authenticated)
		users := api.Group("/users")
		users.Use(middleware.AuthMiddleware())
		{
			users.GET("/profile", handlers.GetProfile)
			users.PUT("/profile", handlers.UpdateProfile)
			users.GET("/addresses", handlers.GetAddresses)
			users.POST("/addresses", handlers.CreateAddress)
			users.PUT("/addresses/:id", handlers.UpdateAddress)
			users.DELETE("/addresses/:id", handlers.DeleteAddress)
			users.POST("/reviews", handlers.CreateReview)
		}

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
		{
			admin.GET("/dashboard", handlers.GetDashboardStats)

			// Product management
			admin.POST("/products", handlers.CreateProduct)
			admin.PUT("/products/:id", handlers.UpdateProduct)
			admin.DELETE("/products/:id", handlers.DeleteProduct)

			// Category management
			admin.POST("/categories", handlers.CreateCategory)
			admin.PUT("/categories/:id", handlers.UpdateCategory)
			admin.DELETE("/categories/:id", handlers.DeleteCategory)

			// Order management
			admin.GET("/orders", handlers.GetAllOrders)
			admin.PUT("/orders/:id/status", handlers.UpdateOrderStatus)

			// User management
			admin.GET("/users", handlers.GetAllUsers)
			admin.PUT("/users/:id/role", handlers.UpdateUserRole)
		}
	}

	log.Printf("🚀 Nexora API server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
