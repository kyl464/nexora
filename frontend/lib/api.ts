const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface FetchOptions extends RequestInit {
    token?: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    }

    private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const { token, ...fetchOptions } = options;
        const authToken = token || this.getToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        if (authToken) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...fetchOptions,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'An error occurred' }));
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Auth
    getGoogleLoginUrl() {
        return `${this.baseUrl}/auth/google`;
    }

    async register(name: string, email: string, password: string) {
        return this.request<{ token: string; user: User }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
    }

    async login(email: string, password: string) {
        return this.request<{ token: string; user: User }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async getMe() {
        return this.request<User>('/auth/me');
    }

    // Products
    async getProducts(params?: ProductsParams) {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set('search', params.search);
        if (params?.category) searchParams.set('category', params.category);
        if (params?.featured) searchParams.set('featured', 'true');
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.sort) searchParams.set('sort', params.sort);
        if (params?.order) searchParams.set('order', params.order);
        if (params?.minPrice) searchParams.set('min_price', params.minPrice.toString());
        if (params?.maxPrice) searchParams.set('max_price', params.maxPrice.toString());

        const query = searchParams.toString();
        return this.request<ProductsResponse>(`/products${query ? `?${query}` : ''}`);
    }

    async getProduct(idOrSlug: string) {
        return this.request<{ product: Product; avg_rating: number }>(`/products/${idOrSlug}`);
    }

    // Categories
    async getCategories() {
        return this.request<Category[]>('/categories');
    }

    // Cart
    async getCart() {
        return this.request<CartResponse>('/cart');
    }

    async addToCart(productId: string, variantId?: string, quantity?: number) {
        return this.request<CartItem>('/cart', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, variant_id: variantId, quantity }),
        });
    }

    async updateCartItem(itemId: string, quantity: number) {
        return this.request<CartItem>(`/cart/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity }),
        });
    }

    async removeFromCart(itemId: string) {
        return this.request<{ message: string }>(`/cart/${itemId}`, {
            method: 'DELETE',
        });
    }

    async clearCart() {
        return this.request<{ message: string }>('/cart', {
            method: 'DELETE',
        });
    }

    // Wishlist
    async getWishlist() {
        return this.request<WishlistItem[]>('/wishlist');
    }

    async addToWishlist(productId: string) {
        return this.request<WishlistItem>('/wishlist', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId }),
        });
    }

    async removeFromWishlist(productId: string) {
        return this.request<{ message: string }>(`/wishlist/${productId}`, {
            method: 'DELETE',
        });
    }

    // Orders
    async getOrders(page?: number) {
        const query = page ? `?page=${page}` : '';
        return this.request<OrdersResponse>(`/orders${query}`);
    }

    async createOrder(addressId: string, notes?: string) {
        return this.request<Order>('/orders', {
            method: 'POST',
            body: JSON.stringify({ address_id: addressId, notes }),
        });
    }

    async getOrder(orderId: string) {
        return this.request<Order>(`/orders/${orderId}`);
    }

    async cancelOrder(orderId: string) {
        return this.request<Order>(`/orders/${orderId}/cancel`, {
            method: 'POST',
        });
    }

    // Payments
    async createPayment(orderId: string) {
        return this.request<{ snap_token: string; redirect_url: string }>(`/payments/${orderId}`, {
            method: 'POST',
        });
    }

    async getPaymentStatus(orderId: string) {
        return this.request<Payment>(`/payments/${orderId}/status`);
    }

    async simulatePayment(orderId: string) {
        return this.request<{ message: string }>(`/payments/${orderId}/simulate`, {
            method: 'POST',
        });
    }

    // User
    async getProfile() {
        return this.request<User>('/users/profile');
    }

    async updateProfile(data: { name?: string; avatar?: string }) {
        return this.request<User>('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async getAddresses() {
        return this.request<Address[]>('/users/addresses');
    }

    async createAddress(data: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
        return this.request<Address>('/users/addresses', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateAddress(addressId: string, data: Partial<Address>) {
        return this.request<Address>(`/users/addresses/${addressId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteAddress(addressId: string) {
        return this.request<{ message: string }>(`/users/addresses/${addressId}`, {
            method: 'DELETE',
        });
    }

    async createReview(productId: string, rating: number, comment?: string) {
        return this.request<Review>('/users/reviews', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, rating, comment }),
        });
    }

    // Admin APIs
    async adminCreateProduct(data: CreateProductInput) {
        return this.request<Product>('/admin/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async adminUpdateProduct(id: string, data: Partial<CreateProductInput>) {
        return this.request<Product>(`/admin/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async adminDeleteProduct(id: string) {
        return this.request<{ message: string }>(`/admin/products/${id}`, {
            method: 'DELETE',
        });
    }

    async adminGetAllOrders(page?: number) {
        const query = page ? `?page=${page}` : '';
        return this.request<OrdersResponse>(`/admin/orders${query}`);
    }

    async adminGetOrderDetail(orderId: string) {
        return this.request<Order>(`/admin/orders/${orderId}`);
    }

    async adminUpdateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
        return this.request<Order>(`/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, tracking_number: trackingNumber }),
        });
    }

    async adminGetAllUsers() {
        const response = await this.request<{ users: User[]; total: number }>('/admin/users');
        return response.users;
    }

    async adminUpdateUserRole(userId: string, role: string) {
        return this.request<User>(`/admin/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role }),
        });
    }

    async adminCreateCategory(name: string, icon?: string) {
        return this.request<Category>('/admin/categories', {
            method: 'POST',
            body: JSON.stringify({ name, icon }),
        });
    }

    async adminUpdateCategory(id: string, data: { name?: string; icon?: string }) {
        return this.request<Category>(`/admin/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async adminDeleteCategory(id: string) {
        return this.request<{ message: string }>(`/admin/categories/${id}`, {
            method: 'DELETE',
        });
    }

    // Guest checkout
    async createGuestOrder(data: {
        guest_email: string;
        guest_name: string;
        guest_phone: string;
        guest_address: string;
        notes?: string;
        items: { product_id: string; variant_id?: string; quantity: number }[];
    }) {
        return this.request<Order>('/guest/order', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async trackGuestOrder(orderNumber: string, email: string) {
        return this.request<Order>('/guest/track', {
            method: 'POST',
            body: JSON.stringify({ order_number: orderNumber, email }),
        });
    }

    async createGuestPayment(orderId: string) {
        return this.request<{ snap_token: string; redirect_url: string }>(`/guest/payment/${orderId}`, {
            method: 'POST',
        });
    }
}

export const api = new ApiClient(API_URL);

// Types
export interface User {
    id: string;
    email: string;
    name: string;
    avatar: string;
    role: 'customer' | 'admin';
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
}

export interface ProductImage {
    id: string;
    url: string;
    order: number;
    is_primary: boolean;
}

export interface ProductVariant {
    id: string;
    name: string;
    value: string;
    price_modifier: number;
    stock: number;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    base_price: number;
    category_id: string;
    category?: Category;
    stock: number;
    is_active: boolean;
    is_featured: boolean;
    images: ProductImage[];
    variants?: ProductVariant[];
    reviews?: Review[];
    created_at: string;
}

export interface ProductsParams {
    search?: string;
    category?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
}

export interface ProductsResponse {
    products: Product[];
    total: number;
    page: number;
    limit: number;
    pages: number;
    total_pages: number;
}

export interface CreateProductInput {
    name: string;
    description?: string;
    base_price: number;
    category_id?: string;
    stock?: number;
    is_active?: boolean;
    is_featured?: boolean;
    images?: string[];
}

export interface CartItem {
    id: string;
    product_id: string;
    product: Product;
    variant_id?: string;
    variant?: ProductVariant;
    quantity: number;
}

export interface CartResponse {
    items: CartItem[];
    subtotal: number;
    count: number;
}

export interface WishlistItem {
    id: string;
    product_id: string;
    product: Product;
}

export interface Address {
    id: string;
    user_id: string;
    label: string;
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    product_id: string;
    product?: Product;
    product_name: string;
    variant_info: string;
    price: number;
    quantity: number;
    subtotal: number;
}

export interface Order {
    id: string;
    order_number?: string;
    user_id?: string;
    user?: User;
    address_id?: string;
    address?: Address;
    status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    subtotal: number;
    shipping_fee: number;
    total: number;
    notes: string;
    // Shipping info
    tracking_number?: string;
    shipped_at?: string;
    delivered_at?: string;
    // Guest checkout fields
    guest_email?: string;
    guest_name?: string;
    guest_phone?: string;
    guest_address?: string;

    items: OrderItem[];
    payment?: Payment;
    created_at: string;
}

export interface OrdersResponse {
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface Payment {
    id: string;
    order_id: string;
    midtrans_id: string;
    status: 'pending' | 'success' | 'failed' | 'expired';
    method: string;
    amount: number;
    snap_token?: string;
    redirect_url?: string;
    paid_at?: string;
}

export interface Review {
    id: string;
    product_id: string;
    user_id: string;
    user?: User;
    rating: number;
    comment: string;
    created_at: string;
}
