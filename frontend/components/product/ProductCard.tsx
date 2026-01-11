'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Product } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { useAuth, useCart, useWishlist } from '@/lib/context';
import { useState } from 'react';

interface ProductCardProps {
    product: Product;
    priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
    const { isAuthenticated, login } = useAuth();
    const { addToCart } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
    const inWishlist = isInWishlist(product.id);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            login();
            return;
        }

        setIsAddingToCart(true);
        try {
            await addToCart(product.id);
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleToggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            login();
            return;
        }

        setIsTogglingWishlist(true);
        try {
            if (inWishlist) {
                await removeFromWishlist(product.id);
            } else {
                await addToWishlist(product.id);
            }
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
        } finally {
            setIsTogglingWishlist(false);
        }
    };

    return (
        <Link
            href={`/products/${product.slug}`}
            className="group card card-hover flex flex-col"
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-dark-700">
                {primaryImage ? (
                    <Image
                        src={primaryImage.url}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        priority={priority}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <ShoppingCart className="w-12 h-12" />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.is_featured && (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-gradient-secondary text-white rounded-full">
                            Featured
                        </span>
                    )}
                    {product.stock === 0 && (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-dark-800/90 text-slate-400 rounded-full">
                            Out of Stock
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleToggleWishlist}
                        disabled={isTogglingWishlist}
                        className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                            inWishlist
                                ? 'bg-red-500 text-white'
                                : 'bg-dark-800/90 text-slate-300 hover:bg-dark-700'
                        )}
                        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <Heart className={cn('w-4 h-4', inWishlist && 'fill-current')} />
                    </button>
                </div>

                {/* Quick Add */}
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                    <button
                        onClick={handleAddToCart}
                        disabled={isAddingToCart || product.stock === 0}
                        className="w-full btn btn-primary btn-sm"
                    >
                        {isAddingToCart ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <ShoppingCart className="w-4 h-4" />
                                Add to Cart
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1">
                {product.category && (
                    <span className="text-xs text-primary font-medium mb-1">
                        {product.category.name}
                    </span>
                )}
                <h3 className="font-medium text-white group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {product.name}
                </h3>
                <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-bold text-white">
                        {formatPrice(product.base_price)}
                    </span>
                    {product.reviews && product.reviews.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span>
                                {(product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

export function ProductCardSkeleton() {
    return (
        <div className="card flex flex-col animate-pulse">
            <div className="aspect-square bg-dark-700" />
            <div className="p-4 space-y-3">
                <div className="h-3 w-16 bg-dark-700 rounded" />
                <div className="h-4 w-full bg-dark-700 rounded" />
                <div className="h-4 w-2/3 bg-dark-700 rounded" />
                <div className="h-5 w-24 bg-dark-700 rounded" />
            </div>
        </div>
    );
}
