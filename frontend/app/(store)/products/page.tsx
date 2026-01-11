'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { api, Product, Category } from '@/lib/api';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Filter state
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'created_at');
    const [order, setOrder] = useState<'asc' | 'desc'>((searchParams.get('order') as 'asc' | 'desc') || 'desc');
    const [page, setPage] = useState(1);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await api.getCategories();
                setCategories(data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const response = await api.getProducts({
                    search: search || undefined,
                    category: category || undefined,
                    sort,
                    order,
                    page,
                    limit: 12,
                    featured: searchParams.get('featured') === 'true' || undefined,
                    minPrice: minPrice ? parseFloat(minPrice) : undefined,
                    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                });
                setProducts(response.products);
                setTotalPages(response.pages);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [search, category, sort, order, page, searchParams, minPrice, maxPrice]);

    const clearFilters = () => {
        setSearch('');
        setCategory('');
        setSort('created_at');
        setOrder('desc');
        setMinPrice('');
        setMaxPrice('');
        setPage(1);
    };

    const hasActiveFilters = search || category || sort !== 'created_at' || order !== 'desc' || minPrice || maxPrice;

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-display text-3xl lg:text-4xl font-bold text-white mb-2">
                        {searchParams.get('featured') === 'true' ? 'Featured Products' : 'All Products'}
                    </h1>
                    <p className="text-slate-400">
                        Discover our curated collection of premium products
                    </p>
                </div>

                {/* Search & Filters Bar */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="input pl-12"
                        />
                    </div>

                    {/* Sort */}
                    <select
                        value={`${sort}-${order}`}
                        onChange={(e) => {
                            const [newSort, newOrder] = e.target.value.split('-');
                            setSort(newSort);
                            setOrder(newOrder as 'asc' | 'desc');
                            setPage(1);
                        }}
                        className="input w-full lg:w-48"
                    >
                        <option value="created_at-desc">Newest First</option>
                        <option value="created_at-asc">Oldest First</option>
                        <option value="base_price-asc">Price: Low to High</option>
                        <option value="base_price-desc">Price: High to Low</option>
                        <option value="name-asc">Name: A-Z</option>
                        <option value="name-desc">Name: Z-A</option>
                    </select>

                    {/* Filter Toggle (Mobile) */}
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="lg:hidden"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                    </Button>
                </div>

                <div className="flex gap-8">
                    {/* Sidebar Filters */}
                    <aside
                        className={cn(
                            'fixed lg:static inset-0 z-50 lg:z-auto bg-dark-900/95 lg:bg-transparent lg:block w-full lg:w-64 flex-shrink-0 transition-transform lg:transition-none',
                            showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                        )}
                    >
                        <div className="h-full lg:h-auto overflow-y-auto p-6 lg:p-0">
                            {/* Mobile Close */}
                            <div className="flex items-center justify-between mb-6 lg:hidden">
                                <h3 className="font-semibold text-white">Filters</h3>
                                <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Category Filter */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-white mb-3">Category</h4>
                                <select
                                    value={category}
                                    onChange={(e) => {
                                        setCategory(e.target.value);
                                        setPage(1);
                                    }}
                                    className="input w-full"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Filter */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-white mb-3">Price Range</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={minPrice}
                                        onChange={(e) => {
                                            setMinPrice(e.target.value);
                                            setPage(1);
                                        }}
                                        className="input w-full text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={(e) => {
                                            setMaxPrice(e.target.value);
                                            setPage(1);
                                        }}
                                        className="input w-full text-sm"
                                    />
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={clearFilters} fullWidth>
                                    Clear Filters
                                </Button>
                            )}

                            {/* Apply (Mobile) */}
                            <Button className="mt-4 lg:hidden" fullWidth onClick={() => setShowFilters(false)}>
                                Apply Filters
                            </Button>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <ProductCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : products.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-12">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <span className="px-4 text-sm text-slate-400">
                                            Page {page} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === totalPages}
                                            onClick={() => setPage(page + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-slate-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
                                <p className="text-slate-400 mb-6">
                                    Try adjusting your search or filter criteria
                                </p>
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
