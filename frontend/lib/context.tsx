'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, User, CartResponse, WishlistItem, Product } from '@/lib/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    setUser: (user: User | null) => void;
}

// Guest cart item for localStorage
interface GuestCartItem {
    productId: string;
    product?: Product;
    quantity: number;
}

interface CartContextType {
    cart: CartResponse | null;
    guestCart: GuestCartItem[];
    isLoading: boolean;
    addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
    cartCount: number;
}

interface WishlistContextType {
    wishlist: WishlistItem[];
    isLoading: boolean;
    addToWishlist: (productId: string) => Promise<void>;
    removeFromWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    refreshWishlist: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CartContext = createContext<CartContextType | undefined>(undefined);
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_CART_KEY = 'nexora_guest_cart';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const userData = await api.getMe();
            setUser(userData);
        } catch {
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = () => {
        window.location.href = '/auth/login';
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartResponse | null>(null);
    const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    // Load guest cart from localStorage
    useEffect(() => {
        if (!isAuthenticated) {
            const savedCart = localStorage.getItem(GUEST_CART_KEY);
            if (savedCart) {
                try {
                    setGuestCart(JSON.parse(savedCart));
                } catch {
                    setGuestCart([]);
                }
            }
        }
    }, [isAuthenticated]);

    // Save guest cart to localStorage
    useEffect(() => {
        if (!isAuthenticated && guestCart.length > 0) {
            localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
        }
    }, [guestCart, isAuthenticated]);

    const refreshCart = useCallback(async () => {
        if (!isAuthenticated) {
            // For guests, load product details for cart items
            if (guestCart.length > 0) {
                const updatedCart = await Promise.all(
                    guestCart.map(async (item) => {
                        if (!item.product) {
                            try {
                                const { product } = await api.getProduct(item.productId);
                                return { ...item, product };
                            } catch {
                                return item;
                            }
                        }
                        return item;
                    })
                );
                setGuestCart(updatedCart);
            }
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.getCart();
            setCart(data);
            // Clear guest cart when logged in
            localStorage.removeItem(GUEST_CART_KEY);
            setGuestCart([]);
        } catch {
            setCart(null);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, guestCart.length]);

    useEffect(() => {
        refreshCart();
    }, [isAuthenticated]);

    const addToCart = async (productId: string, variantId?: string, quantity: number = 1) => {
        if (isAuthenticated) {
            await api.addToCart(productId, variantId, quantity);
            await refreshCart();
        } else {
            // Guest cart - add to localStorage
            const existingIndex = guestCart.findIndex(item => item.productId === productId);
            if (existingIndex >= 0) {
                const updated = [...guestCart];
                updated[existingIndex].quantity += quantity;
                setGuestCart(updated);
            } else {
                // Fetch product details
                try {
                    const { product } = await api.getProduct(productId);
                    setGuestCart([...guestCart, { productId, product, quantity }]);
                } catch {
                    setGuestCart([...guestCart, { productId, quantity }]);
                }
            }
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        if (isAuthenticated) {
            await api.updateCartItem(itemId, quantity);
            await refreshCart();
        } else {
            // Guest cart update (itemId is productId for guest)
            const updated = guestCart.map(item =>
                item.productId === itemId ? { ...item, quantity } : item
            );
            setGuestCart(updated);
        }
    };

    const removeItem = async (itemId: string) => {
        if (isAuthenticated) {
            await api.removeFromCart(itemId);
            await refreshCart();
        } else {
            // Guest cart remove (itemId is productId for guest)
            const updated = guestCart.filter(item => item.productId !== itemId);
            setGuestCart(updated);
            localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updated));
        }
    };

    const clearCart = async () => {
        if (isAuthenticated) {
            await api.clearCart();
            await refreshCart();
        } else {
            setGuestCart([]);
            localStorage.removeItem(GUEST_CART_KEY);
        }
    };

    // Calculate cart count
    const cartCount = isAuthenticated
        ? (cart?.count || 0)
        : guestCart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            guestCart,
            isLoading,
            addToCart,
            updateQuantity,
            removeItem,
            clearCart,
            refreshCart,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    const refreshWishlist = useCallback(async () => {
        if (!isAuthenticated) {
            setWishlist([]);
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.getWishlist();
            setWishlist(data);
        } catch {
            setWishlist([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        refreshWishlist();
    }, [refreshWishlist]);

    const addToWishlist = async (productId: string) => {
        await api.addToWishlist(productId);
        await refreshWishlist();
    };

    const removeFromWishlist = async (productId: string) => {
        await api.removeFromWishlist(productId);
        await refreshWishlist();
    };

    const isInWishlist = (productId: string) => {
        return wishlist.some(item => item.product_id === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlist, isLoading, addToWishlist, removeFromWishlist, isInWishlist, refreshWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}

// Re-export toast for convenience
export { useToast, ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
    // Import dynamically to avoid circular deps
    const { ToastProvider } = require('@/components/ui/Toast');

    return (
        <AuthProvider>
            <CartProvider>
                <WishlistProvider>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </WishlistProvider>
            </CartProvider>
        </AuthProvider>
    );
}
