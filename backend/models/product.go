package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Category represents a product category
type Category struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Slug      string         `gorm:"uniqueIndex;not null" json:"slug"`
	Icon      string         `json:"icon"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Products []Product `gorm:"foreignKey:CategoryID" json:"products,omitempty"`
}

func (c *Category) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// Product represents a product in the store
type Product struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Slug        string         `gorm:"uniqueIndex;not null" json:"slug"`
	Description string         `gorm:"type:text" json:"description"`
	BasePrice   float64        `gorm:"not null" json:"base_price"`
	CategoryID  uuid.UUID      `gorm:"type:uuid" json:"category_id"`
	Stock       int            `gorm:"default:0" json:"stock"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	IsFeatured  bool           `gorm:"default:false" json:"is_featured"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Category Category         `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Images   []ProductImage   `gorm:"foreignKey:ProductID" json:"images,omitempty"`
	Variants []ProductVariant `gorm:"foreignKey:ProductID" json:"variants,omitempty"`
	Reviews  []Review         `gorm:"foreignKey:ProductID" json:"reviews,omitempty"`
}

func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// ProductImage represents an image for a product
type ProductImage struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	ProductID uuid.UUID      `gorm:"type:uuid;not null" json:"product_id"`
	URL       string         `gorm:"not null" json:"url"`
	Order     int            `gorm:"default:0" json:"order"`
	IsPrimary bool           `gorm:"default:false" json:"is_primary"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (pi *ProductImage) BeforeCreate(tx *gorm.DB) error {
	if pi.ID == uuid.Nil {
		pi.ID = uuid.New()
	}
	return nil
}

// ProductVariant represents a variant of a product (size, color, etc.)
type ProductVariant struct {
	ID            uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	ProductID     uuid.UUID      `gorm:"type:uuid;not null" json:"product_id"`
	Name          string         `gorm:"not null" json:"name"`  // e.g., "Size", "Color"
	Value         string         `gorm:"not null" json:"value"` // e.g., "XL", "Red"
	PriceModifier float64        `gorm:"default:0" json:"price_modifier"`
	Stock         int            `gorm:"default:0" json:"stock"`
	SKU           string         `json:"sku"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

func (pv *ProductVariant) BeforeCreate(tx *gorm.DB) error {
	if pv.ID == uuid.Nil {
		pv.ID = uuid.New()
	}
	return nil
}

// Review represents a product review
type Review struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	ProductID uuid.UUID      `gorm:"type:uuid;not null" json:"product_id"`
	UserID    uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	Rating    int            `gorm:"not null" json:"rating"` // 1-5
	Comment   string         `gorm:"type:text" json:"comment"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (r *Review) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
