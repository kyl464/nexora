package handlers

import (
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// TrackingRequest represents the request body for tracking
type TrackingRequest struct {
	TrackingNumber string `json:"tracking_number" binding:"required"`
	Courier        string `json:"courier" binding:"required"`
}

// TrackingHistory represents a tracking event
type TrackingHistory struct {
	Date        string `json:"date"`
	Time        string `json:"time"`
	Description string `json:"description"`
	Location    string `json:"location"`
}

// TrackingResponse represents the tracking response
type TrackingResponse struct {
	Success bool `json:"success"`
	Data    struct {
		TrackingNumber string            `json:"tracking_number"`
		Courier        string            `json:"courier"`
		CourierName    string            `json:"courier_name"`
		Status         string            `json:"status"`
		History        []TrackingHistory `json:"history"`
	} `json:"data"`
}

// TrackShipment generates dummy tracking data
func TrackShipment(c *gin.Context) {
	var input TrackingRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get courier name
	courierNames := map[string]string{
		"jne":      "JNE Express",
		"jnt":      "J&T Express",
		"sicepat":  "SiCepat Express",
		"pos":      "POS Indonesia",
		"anteraja": "AnterAja",
		"ninja":    "Ninja Express",
		"lion":     "Lion Parcel",
		"ide":      "ID Express",
		"spx":      "Shopee Express",
		"lex":      "Lazada Logistics",
	}

	courierName := courierNames[input.Courier]
	if courierName == "" {
		courierName = input.Courier
	}

	// Generate dummy tracking history
	now := time.Now()
	statuses := []string{"delivered", "in_transit", "processing"}
	status := statuses[rand.Intn(len(statuses))]

	var history []TrackingHistory

	switch status {
	case "delivered":
		history = []TrackingHistory{
			{
				Date:        now.AddDate(0, 0, -3).Format("2006-01-02"),
				Time:        "09:30",
				Description: "Paket telah diambil dari seller",
				Location:    "Jakarta Selatan",
			},
			{
				Date:        now.AddDate(0, 0, -2).Format("2006-01-02"),
				Time:        "14:20",
				Description: "Paket telah sampai di gudang transit",
				Location:    "Jakarta Pusat",
			},
			{
				Date:        now.AddDate(0, 0, -2).Format("2006-01-02"),
				Time:        "18:45",
				Description: "Paket dalam perjalanan ke kota tujuan",
				Location:    "Jakarta Pusat",
			},
			{
				Date:        now.AddDate(0, 0, -1).Format("2006-01-02"),
				Time:        "08:00",
				Description: "Paket telah sampai di kota tujuan",
				Location:    "Bandung",
			},
			{
				Date:        now.AddDate(0, 0, -1).Format("2006-01-02"),
				Time:        "10:30",
				Description: "Paket sedang diantar oleh kurir",
				Location:    "Bandung",
			},
			{
				Date:        now.Format("2006-01-02"),
				Time:        "14:15",
				Description: "Paket telah diterima oleh penerima",
				Location:    "Bandung",
			},
		}
	case "in_transit":
		history = []TrackingHistory{
			{
				Date:        now.AddDate(0, 0, -2).Format("2006-01-02"),
				Time:        "10:00",
				Description: "Paket telah diambil dari seller",
				Location:    "Jakarta Selatan",
			},
			{
				Date:        now.AddDate(0, 0, -1).Format("2006-01-02"),
				Time:        "15:30",
				Description: "Paket telah sampai di gudang transit",
				Location:    "Jakarta Pusat",
			},
			{
				Date:        now.Format("2006-01-02"),
				Time:        "08:20",
				Description: "Paket dalam perjalanan ke kota tujuan",
				Location:    "Jakarta Pusat",
			},
		}
	case "processing":
		history = []TrackingHistory{
			{
				Date:        now.Format("2006-01-02"),
				Time:        "11:00",
				Description: "Paket telah diambil dari seller",
				Location:    "Jakarta Selatan",
			},
		}
	}

	response := TrackingResponse{
		Success: true,
	}
	response.Data.TrackingNumber = input.TrackingNumber
	response.Data.Courier = input.Courier
	response.Data.CourierName = courierName
	response.Data.Status = status
	response.Data.History = history

	c.JSON(http.StatusOK, response)
}

// GetCouriers returns list of supported couriers
func GetCouriers(c *gin.Context) {
	couriers := []map[string]string{
		{"code": "jne", "name": "JNE Express"},
		{"code": "jnt", "name": "J&T Express"},
		{"code": "sicepat", "name": "SiCepat Express"},
		{"code": "pos", "name": "POS Indonesia"},
		{"code": "anteraja", "name": "AnterAja"},
		{"code": "ninja", "name": "Ninja Express"},
		{"code": "lion", "name": "Lion Parcel"},
		{"code": "ide", "name": "ID Express"},
		{"code": "spx", "name": "Shopee Express"},
		{"code": "lex", "name": "Lazada Logistics"},
	}
	c.JSON(http.StatusOK, gin.H{"couriers": couriers})
}
