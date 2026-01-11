'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Heart, ShoppingCart, Star, Minus, Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { api, Product, ProductVariant } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import { formatPrice, cn } from '@/lib/utils';
import { useAuth, useCart, useWishlist } from '@/lib/context';
import Link from 'next/link';

export default function ProductDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const { isAuthenticated, login } = useAuth();
    const { addToCart } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

    const [product, setProduct] = useState<Product | null>(null);
    const [avgRating, setAvgRating] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true);
            try {
                const data = await api.getProduct(slug);
                setProduct(data.product);
                setAvgRating(data.avg_rating);

                // Fetch related products
                if (data.product.category_id) {
                    const related = await api.getProducts({
                        category: data.product.category_id,
                        limit: 4,
                    });
                    setRelatedProducts(related.products.filter(p => p.id !== data.product.id));
                }
            } catch (error) {
                console.error('Failed to fetch product:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [slug]);

    const inWishlist = product ? isInWishlist(product.id) : false;

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            login();
            return;
        }

        if (!product) return;

        setIsAddingToCart(true);
        try {
            await addToCart(product.id, selectedVariant?.id, quantity);
            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 2000);
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleToggleWishlist = async () => {
        if (!isAuthenticated) {
            login();
            return;
        }

        if (!product) return;

        try {
            if (inWishlist) {
                await removeFromWishlist(product.id);
            } else {
                await addToWishlist(product.id);
            }
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
        }
    };

    const currentPrice = product
        ? product.base_price + (selectedVariant?.price_modifier || 0)
        : 0;

    if (isLoading) {
        return (
            <div className="min-h-screen py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse">
                        <div className="grid lg:grid-cols-2 gap-12">
                            <div className="aspect-square bg-dark-700 rounded-2xl" />
                            <div className="space-y-6">
                                <div className="h-4 w-20 bg-dark-700 rounded" />
                                <div className="h-8 w-3/4 bg-dark-700 rounded" />
                                <div className="h-6 w-1/3 bg-dark-700 rounded" />
                                <div className="h-24 bg-dark-700 rounded" />
                                <div className="h-12 w-full bg-dark-700 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Product Not Found</h2>
                    <p className="text-slate-400 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
                    <Button href="/products">Browse Products</Button>
                </div>
            </div>
        );
    }

    const images = product.images || [];

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
                    <Link href="/" className="hover:text-white">Home</Link>
                    <span>/</span>
                    <Link href="/products" className="hover:text-white">Products</Link>
                    {product.category && (
                        <>
                            <span>/</span>
                            <Link href={`/products?category=${product.category.id}`} className="hover:text-white">
                                {product.category.name}
                            </Link>
                        </>
                    )}
                    <span>/</span>
                    <span className="text-white">{product.name}</span>
                </nav>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Images */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="relative aspect-square rounded-2xl bg-dark-800 border border-dark-700 overflow-hidden">
                            {images.length > 0 ? (
                                <Image
                                    src={images[currentImageIndex].url}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <ShoppingCart className="w-24 h-24" />
                                </div>
                            )}

                            {/* Navigation */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentImageIndex(i => (i === 0 ? images.length - 1 : i - 1))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-dark-800/90 flex items-center justify-center text-white hover:bg-dark-700"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentImageIndex(i => (i === images.length - 1 ? 0 : i + 1))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-dark-800/90 flex items-center justify-center text-white hover:bg-dark-700"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={cn(
                                            'relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                                            currentImageIndex === index
                                                ? 'border-primary'
                                                : 'border-dark-700 hover:border-dark-600'
                                        )}
                                    >
                                        <Image src={image.url} alt="" fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div>
                        {product.category && (
                            <Link
                                href={`/products?category=${product.category.id}`}
                                className="text-sm text-primary font-medium hover:underline"
                            >
                                {product.category.name}
                            </Link>
                        )}

                        <h1 className="font-display text-3xl lg:text-4xl font-bold text-white mt-2 mb-4">
                            {product.name}
                        </h1>

                        {/* Rating */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            'w-5 h-5',
                                            i < Math.round(avgRating)
                                                ? 'text-yellow-500 fill-yellow-500'
                                                : 'text-slate-600'
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-slate-400">
                                {avgRating.toFixed(1)} ({product.reviews?.length || 0} reviews)
                            </span>
                        </div>

                        {/* Price */}
                        <div className="text-3xl font-bold text-white mb-6">
                            {formatPrice(currentPrice)}
                        </div>

                        {/* Description */}
                        <p className="text-slate-400 mb-8">{product.description}</p>

                        {/* Variants */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-semibold text-white mb-3">
                                    Select {product.variants[0].name}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((variant) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={cn(
                                                'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                                                selectedVariant?.id === variant.id
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-dark-700 text-slate-300 hover:border-dark-600'
                                            )}
                                        >
                                            {variant.value}
                                            {variant.price_modifier > 0 && (
                                                <span className="text-slate-500 ml-1">
                                                    (+{formatPrice(variant.price_modifier)})
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="mb-8">
                            <h4 className="font-semibold text-white mb-3">Quantity</h4>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="w-10 h-10 rounded-lg border border-dark-700 flex items-center justify-center text-slate-300 hover:bg-dark-700"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-20 text-center input"
                                />
                                <button
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="w-10 h-10 rounded-lg border border-dark-700 flex items-center justify-center text-slate-300 hover:bg-dark-700"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-slate-400">
                                    {product.stock} available
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button
                                onClick={handleAddToCart}
                                isLoading={isAddingToCart}
                                disabled={product.stock === 0}
                                className="flex-1"
                                size="lg"
                            >
                                {addedToCart ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Added to Cart!
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5" />
                                        Add to Cart
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleToggleWishlist}
                                className={cn(inWishlist && 'border-red-500 text-red-500')}
                            >
                                <Heart className={cn('w-5 h-5', inWishlist && 'fill-current')} />
                            </Button>
                        </div>

                        {product.stock === 0 && (
                            <p className="mt-4 text-red-400 text-sm">This product is currently out of stock</p>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <section className="mt-20">
                        <h2 className="font-display text-2xl font-bold text-white mb-8">
                            Related Products
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.slice(0, 4).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
