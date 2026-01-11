package handlers

import (
	"bytes"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"nexora-backend/config"
	"nexora-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type MidtransChargeRequest struct {
	TransactionDetails struct {
		OrderID     string  `json:"order_id"`
		GrossAmount float64 `json:"gross_amount"`
	} `json:"transaction_details"`
	CustomerDetails struct {
		FirstName string `json:"first_name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
	} `json:"customer_details"`
}

type MidtransSnapResponse struct {
	Token       string `json:"token"`
	RedirectURL string `json:"redirect_url"`
}

// CreatePayment creates a payment for an order using Midtrans Snap
func CreatePayment(c *gin.Context) {
	userID, _ := c.Get("user_id")
	orderID := c.Param("order_id")

	var order models.Order
	if err := config.DB.Preload("User").Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	if order.Status != models.OrderStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment already processed or order cancelled"})
		return
	}

	// Check if payment already exists
	var existingPayment models.Payment
	if err := config.DB.Where("order_id = ? AND status != ?", order.ID, models.PaymentStatusFailed).First(&existingPayment).Error; err == nil {
		if existingPayment.Status == models.PaymentStatusPending && existingPayment.SnapToken != "" {
			c.JSON(http.StatusOK, gin.H{
				"snap_token":   existingPayment.SnapToken,
				"redirect_url": existingPayment.RedirectURL,
			})
			return
		}
	}

	// Create Midtrans Snap token
	midtransOrderID := fmt.Sprintf("NEXORA-%s-%d", order.ID.String()[:8], time.Now().Unix())

	snapRequest := map[string]interface{}{
		"transaction_details": map[string]interface{}{
			"order_id":     midtransOrderID,
			"gross_amount": int(order.Total),
		},
		"customer_details": map[string]interface{}{
			"first_name": order.User.Name,
			"email":      order.User.Email,
		},
		"callbacks": map[string]interface{}{
			"finish": config.AppConfig.FrontendURL + "/orders/" + order.ID.String(),
		},
	}

	jsonBody, _ := json.Marshal(snapRequest)

	// Determine Midtrans URL based on environment
	midtransURL := "https://app.sandbox.midtrans.com/snap/v1/transactions"
	if config.AppConfig.MidtransIsProduction {
		midtransURL = "https://app.midtrans.com/snap/v1/transactions"
	}

	req, _ := http.NewRequest("POST", midtransURL, bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.SetBasicAuth(config.AppConfig.MidtransServerKey, "")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to payment gateway"})
		return
	}
	bodyBytes, _ := io.ReadAll(resp.Body)
	resp.Body.Close() // Close original body

	// Create new reader for decoding
	resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var snapResp MidtransSnapResponse
	if err := json.NewDecoder(resp.Body).Decode(&snapResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse payment response"})
		return
	}

	if snapResp.Token == "" {
		// Log the raw body to see the error message
		fmt.Printf("Midtrans Error Body: %s\n", string(bodyBytes))

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment token. Check server logs."})
		return
	}

	if snapResp.Token == "" {
		// Debug logging
		fmt.Printf("Midtrans Error: %+v\n", snapResp)
		// Try to read full body for error details
		// (In a real scenario, we should have read the body into a buffer first)

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment token. Check server logs."})
		return
	}

	// Create payment record
	payment := models.Payment{
		OrderID:     order.ID,
		MidtransID:  midtransOrderID,
		Status:      models.PaymentStatusPending,
		Amount:      order.Total,
		SnapToken:   snapResp.Token,
		RedirectURL: snapResp.RedirectURL,
	}

	if err := config.DB.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save payment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"snap_token":   snapResp.Token,
		"redirect_url": snapResp.RedirectURL,
	})
}

// PaymentNotification handles Midtrans webhook notifications
func PaymentNotification(c *gin.Context) {
	var notification map[string]interface{}
	if err := c.ShouldBindJSON(&notification); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	orderID := notification["order_id"].(string)
	statusCode := notification["status_code"].(string)
	grossAmount := notification["gross_amount"].(string)
	signatureKey := notification["signature_key"].(string)
	transactionStatus := notification["transaction_status"].(string)
	paymentType := ""
	if pt, ok := notification["payment_type"].(string); ok {
		paymentType = pt
	}

	// Verify signature
	input := orderID + statusCode + grossAmount + config.AppConfig.MidtransServerKey
	hash := sha512.Sum512([]byte(input))
	expectedSignature := hex.EncodeToString(hash[:])

	if signatureKey != expectedSignature {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid signature"})
		return
	}

	// Find payment
	var payment models.Payment
	if err := config.DB.Where("midtrans_id = ?", orderID).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// Update payment status
	switch transactionStatus {
	case "capture", "settlement":
		payment.Status = models.PaymentStatusSuccess
		now := time.Now()
		payment.PaidAt = &now
		payment.Method = paymentType

		// Update order status
		config.DB.Model(&models.Order{}).Where("id = ?", payment.OrderID).Update("status", models.OrderStatusPaid)

	case "deny", "cancel":
		payment.Status = models.PaymentStatusFailed

	case "expire":
		payment.Status = models.PaymentStatusExpired
	}

	config.DB.Save(&payment)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetPaymentStatus returns the payment status for an order
func GetPaymentStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")
	orderID := c.Param("order_id")

	var order models.Order
	if err := config.DB.Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	var payment models.Payment
	if err := config.DB.Where("order_id = ?", order.ID).Order("created_at desc").First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	c.JSON(http.StatusOK, payment)
}

// SimulatePayment simulates a successful payment (for sandbox testing)
func SimulatePayment(c *gin.Context) {
	if config.AppConfig.MidtransIsProduction {
		c.JSON(http.StatusForbidden, gin.H{"error": "Simulation not available in production"})
		return
	}

	orderID := c.Param("order_id")
	parsedOrderID, err := uuid.Parse(orderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var payment models.Payment
	if err := config.DB.Where("order_id = ?", parsedOrderID).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	payment.Status = models.PaymentStatusSuccess
	payment.Method = "simulation"
	now := time.Now()
	payment.PaidAt = &now

	config.DB.Save(&payment)
	config.DB.Model(&models.Order{}).Where("id = ?", parsedOrderID).Update("status", models.OrderStatusPaid)

	c.JSON(http.StatusOK, gin.H{"message": "Payment simulated successfully"})
}
