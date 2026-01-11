'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useWishlist } from '@/lib/context';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';

export default function WishlistPage() {
    const { wishlist, isLoading } = useWishlist();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || isLoading) {
        return (
            <div className="space-y-4">
                <h2 className="font-display text-xl font-bold text-white mb-4">My Wishlist</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (wishlist.length === 0) {
        return (
            <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Your wishlist is empty</h3>
                <p className="text-slate-400 mb-6">Save items you love for later</p>
                <Button href="/products">Browse Products</Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-white mb-4">
                My Wishlist ({wishlist.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlist.map((item) => (
                    <ProductCard key={item.id} product={item.product} />
                ))}
            </div>
        </div>
    );
}
