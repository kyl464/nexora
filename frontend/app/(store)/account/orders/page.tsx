'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight, Loader2 } from 'lucide-react';
import { api, Order } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDateTime, getStatusBgColor, getStatusLabel, cn } from '@/lib/utils';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            try {
                const data = await api.getOrders(page);
                setOrders(data.orders);
                setTotalPages(data.pages);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [page]);

    if (isLoading) {
        return (
            <div className="card p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No orders yet</h3>
                <p className="text-slate-400 mb-6">Start shopping to see your orders here</p>
                <Button href="/products">Browse Products</Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-white mb-4">Order History</h2>

            {orders.map((order) => {
                const firstItem = order.items?.[0];
                const image = firstItem?.product?.images?.[0];
                const otherItemsCount = (order.items?.length || 0) - 1;

                return (
                    <Link
                        key={order.id}
                        href={`/orders/${order.id}`}
                        className="card p-4 flex flex-col sm:flex-row gap-4 hover:border-dark-600 transition-colors"
                    >
                        {/* Image */}
                        <div className="relative w-20 h-20 rounded-xl bg-dark-700 overflow-hidden flex-shrink-0">
                            {image ? (
                                <Image src={image.url} alt="" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <Package className="w-8 h-8" />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                    <p className="font-medium text-white">
                                        Order #{order.id.slice(0, 8)}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        {formatDateTime(order.created_at)}
                                    </p>
                                </div>
                                <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusBgColor(order.status))}>
                                    {getStatusLabel(order.status)}
                                </span>
                            </div>

                            <p className="text-sm text-slate-400 truncate mb-2">
                                {firstItem?.product_name}
                                {otherItemsCount > 0 && ` +${otherItemsCount} more`}
                            </p>

                            <div className="flex items-center justify-between">
                                <p className="font-semibold text-white">{formatPrice(order.total)}</p>
                                <ChevronRight className="w-5 h-5 text-slate-500" />
                            </div>
                        </div>
                    </Link>
                );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
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
        </div>
    );
}
