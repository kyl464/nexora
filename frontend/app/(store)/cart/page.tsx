'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth, useCart } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
    const { isAuthenticated, login } = useAuth();
    const { cart, guestCart, isLoading, updateQuantity, removeItem, clearCart, cartCount } = useCart();
    const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

    if (isLoading) {
        return (
            <div className="min-h-screen py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 w-40 bg-dark-700 rounded" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-dark-700 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Use either authenticated cart or guest cart
    const items = isAuthenticated
        ? (cart?.items || [])
        : guestCart.filter(item => item.product).map(item => ({
            id: item.productId,
            product: item.product!,
            quantity: item.quantity,
            variant: null,
        }));

    const subtotal = isAuthenticated
        ? (cart?.subtotal || 0)
        : guestCart.reduce((sum, item) => sum + (item.product?.base_price || 0) * item.quantity, 0);

    const shippingFee = subtotal > 500000 ? 0 : 15000;
    const total = subtotal + shippingFee;

    const handleUpdateQuantity = async (itemId: string, quantity: number) => {
        setUpdatingItems((prev) => new Set(prev).add(itemId));
        try {
            await updateQuantity(itemId, quantity);
        } finally {
            setUpdatingItems((prev) => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        setUpdatingItems((prev) => new Set(prev).add(itemId));
        try {
            await removeItem(itemId);
        } finally {
            setUpdatingItems((prev) => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-10 h-10 text-slate-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
                    <p className="text-slate-400 mb-6">
                        Looks like you haven&apos;t added anything to your cart yet
                    </p>
                    <Button href="/products">Start Shopping</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="font-display text-3xl font-bold text-white">
                        Shopping Cart ({cartCount})
                    </h1>
                    <Button variant="ghost" onClick={clearCart} className="text-red-400 hover:text-red-300">
                        Clear Cart
                    </Button>
                </div>

                {/* Guest notice */}
                {!isAuthenticated && (
                    <div className="card p-4 mb-6 bg-primary/5 border-primary/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <UserPlus className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-white font-medium">Shopping as Guest</p>
                                    <p className="text-sm text-slate-400">Sign in to save your cart and track orders</p>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={login}>Sign In</Button>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => {
                            const isUpdating = updatingItems.has(item.id);
                            const primaryImage = item.product.images?.find((img) => img.is_primary) || item.product.images?.[0];
                            const itemPrice = item.product.base_price + (item.variant?.price_modifier || 0);

                            return (
                                <div
                                    key={item.id}
                                    className="card p-4 flex gap-4 sm:gap-6"
                                >
                                    {/* Image */}
                                    <Link
                                        href={`/products/${item.product.slug}`}
                                        className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-dark-700 overflow-hidden flex-shrink-0"
                                    >
                                        {primaryImage ? (
                                            <Image
                                                src={primaryImage.url}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                <ShoppingBag className="w-8 h-8" />
                                            </div>
                                        )}
                                    </Link>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/products/${item.product.slug}`}
                                            className="font-medium text-white hover:text-primary transition-colors line-clamp-2"
                                        >
                                            {item.product.name}
                                        </Link>
                                        {item.variant && (
                                            <p className="text-sm text-slate-400 mt-1">
                                                {item.variant.name}: {item.variant.value}
                                            </p>
                                        )}
                                        <p className="text-lg font-semibold text-white mt-2">
                                            {formatPrice(itemPrice)}
                                        </p>
                                    </div>

                                    {/* Quantity & Remove */}
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                disabled={isUpdating || item.quantity <= 1}
                                                className="w-8 h-8 rounded-lg border border-dark-700 flex items-center justify-center text-slate-400 hover:bg-dark-700 disabled:opacity-50"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-8 text-center text-white">{item.quantity}</span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                disabled={isUpdating}
                                                className="w-8 h-8 rounded-lg border border-dark-700 flex items-center justify-center text-slate-400 hover:bg-dark-700 disabled:opacity-50"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            disabled={isUpdating}
                                            className="text-red-400 hover:text-red-300 disabled:opacity-50"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="card p-6 sticky top-24">
                            <h3 className="font-semibold text-white text-lg mb-6">Order Summary</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span>Subtotal</span>
                                    <span className="text-white">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-400">
                                    <span>Shipping</span>
                                    <span className="text-white">
                                        {shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}
                                    </span>
                                </div>
                                {shippingFee > 0 && (
                                    <p className="text-xs text-primary">
                                        Add {formatPrice(500000 - subtotal)} more for free shipping!
                                    </p>
                                )}
                                <div className="border-t border-dark-700 pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white">Total</span>
                                        <span className="text-xl font-bold text-white">{formatPrice(total)}</span>
                                    </div>
                                </div>
                            </div>

                            <Button href="/checkout" fullWidth size="lg">
                                Proceed to Checkout
                                <ArrowRight className="w-5 h-5" />
                            </Button>

                            <Link
                                href="/products"
                                className="block text-center text-sm text-slate-400 hover:text-white mt-4"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
