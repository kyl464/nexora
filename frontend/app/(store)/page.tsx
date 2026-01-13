import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Truck, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import { api, Product } from '@/lib/api';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getFeaturedProducts(): Promise<Product[]> {
    try {
        const response = await api.getProducts({ featured: true, limit: 8 });
        return response.products;
    } catch {
        return [];
    }
}

export default async function HomePage() {
    const featuredProducts = await getFeaturedProducts();

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-dark" />
                <div className="absolute inset-0 bg-gradient-glow opacity-50" />

                {/* Floating Elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Content */}
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-sm font-medium mb-6">
                                <Sparkles className="w-4 h-4" />
                                New Arrivals Every Week
                            </div>

                            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                                Discover{' '}
                                <span className="gradient-text">What&apos;s Next</span>
                            </h1>

                            <p className="text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 mb-8">
                                Premium products, curated just for you. Experience the future of online shopping with Nexora.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <Button href="/products" size="lg">
                                    Start Shopping
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                                <Button href="/categories" variant="outline" size="lg">
                                    Browse Categories
                                </Button>
                            </div>
                        </div>

                        {/* Hero Image */}
                        <div className="relative hidden lg:block">
                            <div className="relative w-full aspect-square max-w-lg mx-auto">
                                <div className="absolute inset-0 bg-gradient-primary rounded-3xl rotate-6 opacity-20" />
                                <div className="absolute inset-0 bg-dark-800 rounded-3xl border border-dark-700 overflow-hidden">
                                    <Image
                                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"
                                        alt="Shopping"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>

                                {/* Floating Cards */}
                                <div className="absolute -top-4 -right-4 p-4 rounded-2xl glass animate-float">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                            <Truck className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Free Shipping</p>
                                            <p className="text-sm font-semibold text-white">Orders 500K+</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute -bottom-4 -left-4 p-4 rounded-2xl glass animate-float" style={{ animationDelay: '0.5s' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                            <Shield className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Secure Payment</p>
                                            <p className="text-sm font-semibold text-white">100% Protected</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-12 border-y border-dark-700 bg-dark-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Truck className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white">Free Shipping</h4>
                                <p className="text-sm text-slate-400">On orders over 500K</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-6 h-6 text-secondary" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white">Secure Payment</h4>
                                <p className="text-sm text-slate-400">100% secure checkout</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                                <CreditCard className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white">Easy Returns</h4>
                                <p className="text-sm text-slate-400">7 days return policy</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white">Quality Products</h4>
                                <p className="text-sm text-slate-400">Curated selection</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Shop With Us */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
                            Why Shop With Us
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            We&apos;re committed to providing the best shopping experience for our customers
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="text-center p-8 rounded-2xl bg-dark-800 border border-dark-700 hover:border-primary/30 transition-colors">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Shield className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-semibold text-white text-xl mb-3">Guaranteed Quality</h3>
                            <p className="text-slate-400">
                                All our products are carefully curated and quality-checked before being listed in our store.
                            </p>
                        </div>

                        <div className="text-center p-8 rounded-2xl bg-dark-800 border border-dark-700 hover:border-secondary/30 transition-colors">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
                                <Truck className="w-8 h-8 text-secondary" />
                            </div>
                            <h3 className="font-semibold text-white text-xl mb-3">Fast Delivery</h3>
                            <p className="text-slate-400">
                                Get your orders delivered quickly with our reliable shipping partners across Indonesia.
                            </p>
                        </div>

                        <div className="text-center p-8 rounded-2xl bg-dark-800 border border-dark-700 hover:border-emerald-500/30 transition-colors md:col-span-2 lg:col-span-1">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
                                <CreditCard className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="font-semibold text-white text-xl mb-3">Secure Payment</h3>
                            <p className="text-slate-400">
                                Shop with confidence using our secure payment gateway with multiple payment options.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-16 lg:py-24 bg-dark-800/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
                                Featured Products
                            </h2>
                            <p className="text-slate-400">
                                Hand-picked products just for you
                            </p>
                        </div>
                        <Button href="/products?featured=true" variant="outline">
                            View All
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredProducts.length > 0 ? (
                            featuredProducts.map((product, index) => (
                                <ProductCard key={product.id} product={product} priority={index < 4} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 mb-4">No featured products yet</p>
                                <Button href="/products" variant="outline" size="sm">
                                    Browse All Products
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 lg:p-16">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative text-center">
                            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
                                Ready to Start Shopping?
                            </h2>
                            <p className="text-white/80 max-w-2xl mx-auto mb-8">
                                Join thousands of happy customers and discover premium products at unbeatable prices.
                            </p>
                            <Button href="/products" variant="secondary" size="lg">
                                Explore Products
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
