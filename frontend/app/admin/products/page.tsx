'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    MoreVertical,
    Package,
    Loader2
} from 'lucide-react';
import { api, Product } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatPrice, cn } from '@/lib/utils';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchProducts();
    }, [currentPage, searchQuery]);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const data = await api.getProducts({
                page: currentPage,
                limit: 10,
                search: searchQuery || undefined,
            });
            setProducts(data.products);
            setTotalPages(data.total_pages);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await api.adminDeleteProduct(id);
            fetchProducts(); // Refresh list
        } catch (error) {
            console.error('Failed to delete product:', error);
            alert('Failed to delete product');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold text-white">Products</h1>
                    <p className="text-slate-400 mt-1">Manage your product catalog</p>
                </div>
                <Link href="/admin/products/new">
                    <Button>
                        <Plus className="w-5 h-5" />
                        Add Product
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="card p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="input pl-12 w-full"
                    />
                </div>
            </div>

            {/* Products Table */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-8 text-center">
                        <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400">No products found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-700/50 border-b border-dark-700">
                                <tr>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Product</th>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Category</th>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Price</th>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Stock</th>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Status</th>
                                    <th className="text-right text-sm font-medium text-slate-400 px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-dark-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
                                                    {product.images?.[0] && (
                                                        <Image
                                                            src={product.images[0].url}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{product.name}</p>
                                                    <p className="text-sm text-slate-400">{product.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {product.category?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">
                                            {formatPrice(product.base_price)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                'font-medium',
                                                product.stock < 10 ? 'text-amber-500' : 'text-slate-300'
                                            )}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                'px-2 py-1 rounded-full text-xs font-medium',
                                                product.is_active
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : 'bg-slate-500/10 text-slate-500'
                                            )}>
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/products/${product.id}/edit`}
                                                    className="p-2 rounded-lg hover:bg-dark-600 text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-dark-700">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                    'w-10 h-10 rounded-lg font-medium transition-colors',
                                    page === currentPage
                                        ? 'bg-primary text-white'
                                        : 'text-slate-400 hover:bg-dark-700 hover:text-white'
                                )}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
