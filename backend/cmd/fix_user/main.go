package main

import (
	"log"

	"nexora-backend/config"
	"nexora-backend/models"
)

func main() {
	log.Println("Starting user cleanup...")

	// Load config and connect to database
	config.Load()
	config.InitDatabase()

	email := "drgs2004@gmail.com"

	// Check if user exists
	var user models.User
	if err := config.DB.Where("email = ?", email).First(&user).Error; err != nil {
		log.Printf("User with email %s not found or already deleted: %v\n", email, err)
		return
	}

	// Delete user
	// Unscoped() is used to delete permanently (ignoring DeletedAt soft delete if enabled, though User model has DeletedAt)
	// If you want hard delete:
	if err := config.DB.Unscoped().Delete(&user).Error; err != nil {
		log.Fatalf("Failed to delete user: %v", err)
	}

	log.Printf("Successfully deleted user: %s (%s)\n", user.Name, user.Email)
}
