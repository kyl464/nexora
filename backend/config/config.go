package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                 string
	Env                  string
	DBHost               string
	DBPort               string
	DBUser               string
	DBPassword           string
	DBName               string
	JWTSecret            string
	GoogleClientID       string
	GoogleClientSecret   string
	GoogleRedirectURL    string
	MidtransServerKey    string
	MidtransClientKey    string
	MidtransIsProduction bool
	FrontendURL          string
}

var AppConfig *Config

func Load() *Config {
	godotenv.Load()

	AppConfig = &Config{
		Port:                 getEnv("PORT", "8080"),
		Env:                  getEnv("ENV", "development"),
		DBHost:               getEnv("DB_HOST", "localhost"),
		DBPort:               getEnv("DB_PORT", "5432"),
		DBUser:               getEnv("DB_USER", "postgres"),
		DBPassword:           getEnv("DB_PASSWORD", ""),
		DBName:               getEnv("DB_NAME", "nexora"),
		JWTSecret:            getEnv("JWT_SECRET", "secret"),
		GoogleClientID:       getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:   getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:    getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/auth/google/callback"),
		MidtransServerKey:    getEnv("MIDTRANS_SERVER_KEY", ""),
		MidtransClientKey:    getEnv("MIDTRANS_CLIENT_KEY", ""),
		MidtransIsProduction: getEnv("MIDTRANS_IS_PRODUCTION", "false") == "true",
		FrontendURL:          getEnv("FRONTEND_URL", "http://localhost:3000"),
	}

	return AppConfig
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
