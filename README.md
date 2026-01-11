# Nexora E-Commerce Platform

A modern, full-stack e-commerce platform built with **Next.js**, **Go**, and **PostgreSQL**.

![Nexora](https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800)

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Go 1.21+, Gin Framework, GORM |
| Database | PostgreSQL |
| Auth | Google OAuth 2.0 + JWT |
| Payment | Midtrans Sandbox |

## 📦 Project Structure

```
nexora/
├── backend/           # Go API server
│   ├── config/        # Configuration & database
│   ├── handlers/      # API handlers
│   ├── middleware/    # Auth & CORS middleware
│   ├── models/        # GORM models
│   └── cmd/seed/      # Database seeder
│
└── frontend/          # Next.js 14 app
    ├── app/           # App Router pages
    ├── components/    # React components
    ├── lib/           # API client & utilities
    └── styles/        # Global styles
```

## 🛠️ Setup Instructions

### Prerequisites
- Go 1.21+
- Node.js 18+
- PostgreSQL

### Backend Setup

1. Navigate to backend:
   ```bash
   cd backend
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your credentials:
   ```env
   DB_PASSWORD=your_postgres_password
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   MIDTRANS_SERVER_KEY=your_midtrans_server_key
   MIDTRANS_CLIENT_KEY=your_midtrans_client_key
   ```

4. Install dependencies & run:
   ```bash
   go mod tidy
   go run main.go
   ```

5. Seed database (optional):
   ```bash
   go run cmd/seed/main.go
   ```

### Frontend Setup

1. Navigate to frontend:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## ✨ Features

### 🛒 Store
- Product browsing with search & filters
- Product detail with image gallery & variants
- Shopping cart with quantity controls
- Wishlist functionality
- Checkout with address management
- Order tracking with status timeline

### 👤 User Account
- Google OAuth sign-in
- Profile management
- Order history
- Saved addresses
- Wishlist

### 💳 Payment
- Midtrans integration (sandbox mode)
- Multiple payment methods
- Payment status tracking

## 🎨 Design

- Dark theme with Indigo (#6366F1) + Orange (#F97316) accent
- Glassmorphism effects
- Smooth animations
- Fully responsive

## 📝 API Endpoints

### Public
- `GET /api/products` - List products
- `GET /api/products/:slug` - Get product
- `GET /api/categories` - List categories

### Auth
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user

### Protected
- `GET/POST /api/cart` - Cart operations
- `GET/POST /api/wishlist` - Wishlist operations
- `GET/POST /api/orders` - Order operations
- `POST /api/payments/:order_id` - Create payment

## 📄 License

MIT License - Feel free to use for your portfolio!
