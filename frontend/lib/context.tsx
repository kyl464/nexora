'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, User, CartResponse, WishlistItem } from '@/lib/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    setUser: (user: User | null) => void;
}

interface CartContextType {
    cart: CartResponse | null;
    isLoading: boolean;
    addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
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
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    const refreshCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCart(null);
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.getCart();
            setCart(data);
        } catch {
            setCart(null);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const addToCart = async (productId: string, variantId?: string, quantity?: number) => {
        await api.addToCart(productId, variantId, quantity);
        await refreshCart();
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        await api.updateCartItem(itemId, quantity);
        await refreshCart();
    };

    const removeItem = async (itemId: string) => {
        await api.removeFromCart(itemId);
        await refreshCart();
    };

    const clearCart = async () => {
        await api.clearCart();
        await refreshCart();
    };

    return (
        <CartContext.Provider value={{ cart, isLoading, addToCart, updateQuantity, removeItem, clearCart, refreshCart }}>
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

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <CartProvider>
                <WishlistProvider>
                    {children}
                </WishlistProvider>
            </CartProvider>
        </AuthProvider>
    );
}
