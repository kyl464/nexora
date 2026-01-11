package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a user account
type User struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Name      string         `gorm:"not null" json:"name"`
	Password  string         `gorm:"" json:"-"` // Optional, only for email auth
	Avatar    string         `json:"avatar"`
	GoogleID  *string        `gorm:"uniqueIndex" json:"google_id,omitempty"` // Pointer allows NULL for non-Google users
	Role      string         `gorm:"default:customer" json:"role"`           // customer, admin
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Addresses     []Address      `gorm:"foreignKey:UserID" json:"addresses,omitempty"`
	Orders        []Order        `gorm:"foreignKey:UserID" json:"orders,omitempty"`
	CartItems     []CartItem     `gorm:"foreignKey:UserID" json:"cart_items,omitempty"`
	WishlistItems []WishlistItem `gorm:"foreignKey:UserID" json:"wishlist_items,omitempty"`
	Reviews       []Review       `gorm:"foreignKey:UserID" json:"reviews,omitempty"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// Address represents a user's shipping address
type Address struct {
	ID         uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	UserID     uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	Label      string         `gorm:"not null" json:"label"` // Home, Office, etc.
	Name       string         `gorm:"not null" json:"name"`
	Phone      string         `gorm:"not null" json:"phone"`
	Street     string         `gorm:"not null" json:"street"`
	City       string         `gorm:"not null" json:"city"`
	State      string         `gorm:"not null" json:"state"`
	PostalCode string         `gorm:"not null" json:"postal_code"`
	Country    string         `gorm:"default:Indonesia" json:"country"`
	IsDefault  bool           `gorm:"default:false" json:"is_default"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

func (a *Address) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
