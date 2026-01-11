package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// OrderStatus represents the status of an order
type OrderStatus string

const (
	OrderStatusPending    OrderStatus = "pending"
	OrderStatusPaid       OrderStatus = "paid"
	OrderStatusProcessing OrderStatus = "processing"
	OrderStatusShipped    OrderStatus = "shipped"
	OrderStatusDelivered  OrderStatus = "delivered"
	OrderStatusCancelled  OrderStatus = "cancelled"
)

// Order represents a customer order
type Order struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	UserID      uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	AddressID   uuid.UUID      `gorm:"type:uuid" json:"address_id"`
	Status      OrderStatus    `gorm:"default:pending" json:"status"`
	Subtotal    float64        `gorm:"not null" json:"subtotal"`
	ShippingFee float64        `gorm:"default:0" json:"shipping_fee"`
	Total       float64        `gorm:"not null" json:"total"`
	Notes       string         `json:"notes"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	User    User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Address Address     `gorm:"foreignKey:AddressID" json:"address,omitempty"`
	Items   []OrderItem `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	Payment *Payment    `gorm:"foreignKey:OrderID" json:"payment,omitempty"`
}

func (o *Order) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}

// OrderItem represents an item in an order
type OrderItem struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	OrderID     uuid.UUID      `gorm:"type:uuid;not null" json:"order_id"`
	ProductID   uuid.UUID      `gorm:"type:uuid;not null" json:"product_id"`
	VariantID   *uuid.UUID     `gorm:"type:uuid" json:"variant_id,omitempty"`
	ProductName string         `gorm:"not null" json:"product_name"`
	VariantInfo string         `json:"variant_info"`
	Price       float64        `gorm:"not null" json:"price"`
	Quantity    int            `gorm:"not null" json:"quantity"`
	Subtotal    float64        `gorm:"not null" json:"subtotal"`
	CreatedAt   time.Time      `json:"created_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Product Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

func (oi *OrderItem) BeforeCreate(tx *gorm.DB) error {
	if oi.ID == uuid.Nil {
		oi.ID = uuid.New()
	}
	return nil
}

// PaymentStatus represents the status of a payment
type PaymentStatus string

const (
	PaymentStatusPending PaymentStatus = "pending"
	PaymentStatusSuccess PaymentStatus = "success"
	PaymentStatusFailed  PaymentStatus = "failed"
	PaymentStatusExpired PaymentStatus = "expired"
)

// Payment represents a payment for an order
type Payment struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	OrderID     uuid.UUID      `gorm:"type:uuid;not null" json:"order_id"`
	MidtransID  string         `gorm:"uniqueIndex" json:"midtrans_id"`
	Status      PaymentStatus  `gorm:"default:pending" json:"status"`
	Method      string         `json:"method"`
	Amount      float64        `gorm:"not null" json:"amount"`
	SnapToken   string         `json:"snap_token,omitempty"`
	RedirectURL string         `json:"redirect_url,omitempty"`
	PaidAt      *time.Time     `json:"paid_at,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
