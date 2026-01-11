'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ShoppingCart,
    Loader2,
    Eye,
    Clock,
    Package,
    Truck,
    CheckCircle,
    XCircle,
    CreditCard
} from 'lucide-react';
import { api, Order } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    pending: { label: 'Menunggu Pembayaran', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
    paid: { label: 'Dibayar', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    processing: { label: 'Diproses', icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    shipped: { label: 'Dikirim', icon: Truck, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
    delivered: { label: 'Selesai', icon: CheckCircle, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30' },
    cancelled: { label: 'Dibatalkan', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
};

const orderStatuses = ['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, [currentPage, statusFilter]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await api.adminGetAllOrders(currentPage);
            let filteredOrders = data.orders || [];
            if (statusFilter !== 'all') {
                filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
            }
            setOrders(filteredOrders);
            setTotalPages(data.pages || 1);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setIsUpdating(orderId);
        try {
            await api.adminUpdateOrderStatus(orderId, newStatus);
            await fetchOrders();
        } catch (error) {
            console.error('Failed to update order:', error);
            alert('Failed to update order status');
        } finally {
            setIsUpdating(null);
        }
    };

    const getCustomerName = (order: Order) => {
        if (order.guest_name) return order.guest_name;
        if (order.user?.name) return order.user.name;
        if (order.address?.name) return order.address.name;
        return 'Unknown';
    };

    const getCustomerContact = (order: Order) => {
        if (order.guest_phone) return order.guest_phone;
        if (order.guest_email) return order.guest_email;
        if (order.address?.phone) return order.address.phone;
        return '';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-display text-3xl font-bold text-white">Orders</h1>
                <p className="text-slate-400 mt-1">Manage customer orders</p>
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
                {orderStatuses.map((status) => {
                    const config = statusConfig[status];
                    return (
                        <button
                            key={status}
                            onClick={() => {
                                setStatusFilter(status);
                                setCurrentPage(1);
                            }}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                                statusFilter === status
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-dark-800 text-slate-400 border-dark-700 hover:text-white hover:border-dark-600'
                            )}
                        >
                            {status === 'all' ? 'All Orders' : config?.label || status}
                        </button>
                    );
                })}
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="card p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="card p-8 text-center">
                        <ShoppingCart className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400">No orders found</p>
                    </div>
                ) : (
                    orders.map((order) => {
                        const status = statusConfig[order.status] || statusConfig.pending;
                        const StatusIcon = status.icon;

                        return (
                            <div key={order.id} className="card p-4 sm:p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                    {/* Order Info */}
                                    <div className="flex-1 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Order ID & Date */}
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Order</p>
                                            <p className="font-mono text-white font-medium">
                                                {order.order_number || `#${order.id.slice(0, 8)}`}
                                            </p>
                                            <p className="text-xs text-slate-400">{formatDateTime(order.created_at)}</p>
                                        </div>

                                        {/* Customer */}
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Customer</p>
                                            <p className="text-white font-medium">{getCustomerName(order)}</p>
                                            <p className="text-xs text-slate-400">{getCustomerContact(order)}</p>
                                        </div>

                                        {/* Items & Total */}
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Items</p>
                                            <p className="text-white">{order.items?.length || 0} items</p>
                                            <p className="text-primary font-semibold">{formatPrice(order.total)}</p>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Status</p>
                                            <div className={cn(
                                                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border',
                                                status.bg
                                            )}>
                                                <StatusIcon className={cn('w-4 h-4', status.color)} />
                                                <span className={cn('text-sm font-medium', status.color)}>
                                                    {status.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 lg:ml-4">
                                        <Link href={`/admin/orders/${order.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4" />
                                                Details
                                            </Button>
                                        </Link>

                                        {order.status === 'paid' && (
                                            <Button
                                                size="sm"
                                                onClick={() => updateOrderStatus(order.id, 'processing')}
                                                isLoading={isUpdating === order.id}
                                            >
                                                <Package className="w-4 h-4" />
                                                Process
                                            </Button>
                                        )}

                                        {order.status === 'processing' && (
                                            <Link href={`/admin/orders/${order.id}`}>
                                                <Button size="sm">
                                                    <Truck className="w-4 h-4" />
                                                    Ship
                                                </Button>
                                            </Link>
                                        )}

                                        {order.status === 'shipped' && (
                                            <Button
                                                size="sm"
                                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                                                isLoading={isUpdating === order.id}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Delivered
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
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
    );
}
