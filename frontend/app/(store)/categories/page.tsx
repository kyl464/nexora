'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Category } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Dynamic icon component
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const iconName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Box;
    return <Icon className={className} />;
};

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await api.getCategories();
                setCategories(data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                        Shop by Category
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Browse our curated collection of products organized by category
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/products?category=${category.id}`}
                            className="group card p-8 text-center hover:border-primary/50 transition-all duration-300"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <DynamicIcon name={category.icon || 'box'} className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-primary transition-colors">
                                {category.name}
                            </h3>
                            <p className="text-sm text-slate-400">
                                Browse products →
                            </p>
                        </Link>
                    ))}
                </div>

                {/* All Products Link */}
                <div className="text-center mt-12">
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                    >
                        View all products
                        <LucideIcons.ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
