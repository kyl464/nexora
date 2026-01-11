'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    ShoppingCart,
    Loader2,
    Eye,
    Check,
    X,
    Truck,
    Package
} from 'lucide-react';
import { api, Order } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDateTime, getStatusBgColor, getStatusLabel, cn } from '@/lib/utils';

const orderStatuses = ['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [currentPage, statusFilter]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await api.getOrders(currentPage);
            let filteredOrders = data.orders;
            if (statusFilter !== 'all') {
                filteredOrders = data.orders.filter(o => o.status === statusFilter);
            }
            setOrders(filteredOrders);
            setTotalPages(data.total_pages);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setIsUpdating(true);
        try {
            // TODO: Implement update order status API
            alert(`Update order ${orderId} to ${newStatus} - API pending`);
            await fetchOrders();
        } catch (error) {
            console.error('Failed to update order:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-display text-3xl font-bold text-white">Orders</h1>
                <p className="text-slate-400 mt-1">Manage customer orders</p>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-wrap gap-2">
                    {orderStatuses.map((status) => (
                        <button
                            key={status}
                            onClick={() => {
                                setStatusFilter(status);
                                setCurrentPage(1);
                            }}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                                statusFilter === status
                                    ? 'bg-primary text-white'
                                    : 'bg-dark-700 text-slate-400 hover:text-white'
                            )}
                        >
                            {status === 'all' ? 'All Orders' : getStatusLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-8 text-center">
                        <ShoppingCart className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400">No orders found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-700/50 border-b border-dark-700">
                                <tr>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Order ID</th>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Date</th>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Customer</th>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Items</th>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Total</th>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Status</th>
                                    <th className="text-right text-sm font-medium text-slate-400 px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-dark-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-white">#{order.id.slice(0, 8)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {formatDateTime(order.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-white">{order.address?.name || 'N/A'}</p>
                                            <p className="text-sm text-slate-400">{order.address?.phone || ''}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {order.items?.length || 0} items
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">
                                            {formatPrice(order.total)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                'px-3 py-1 rounded-full text-xs font-medium',
                                                getStatusBgColor(order.status)
                                            )}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-2 rounded-lg hover:bg-dark-600 text-slate-400 hover:text-white transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {order.status === 'paid' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(order.id, 'processing')}
                                                        className="p-2 rounded-lg hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-500 transition-colors"
                                                        title="Mark as Processing"
                                                    >
                                                        <Package className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {order.status === 'processing' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                                                        className="p-2 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors"
                                                        title="Mark as Shipped"
                                                    >
                                                        <Truck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                                                        className="p-2 rounded-lg hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition-colors"
                                                        title="Mark as Delivered"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
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

            {/* Order Detail Modal */}
            {selectedOrder && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setSelectedOrder(null)}
                    />
                    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-dark-800 border-l border-dark-700 z-50 overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-semibold text-xl text-white">
                                    Order #{selectedOrder.id.slice(0, 8)}
                                </h2>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 rounded-lg hover:bg-dark-700 text-slate-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Status */}
                                <div>
                                    <p className="text-sm text-slate-400 mb-2">Status</p>
                                    <span className={cn(
                                        'px-3 py-1 rounded-full text-sm font-medium',
                                        getStatusBgColor(selectedOrder.status)
                                    )}>
                                        {getStatusLabel(selectedOrder.status)}
                                    </span>
                                </div>

                                {/* Customer */}
                                <div>
                                    <p className="text-sm text-slate-400 mb-2">Customer</p>
                                    <p className="text-white">{selectedOrder.address?.name}</p>
                                    <p className="text-slate-400">{selectedOrder.address?.phone}</p>
                                    <p className="text-slate-400 text-sm mt-1">
                                        {selectedOrder.address?.street}, {selectedOrder.address?.city}
                                    </p>
                                </div>

                                {/* Items */}
                                <div>
                                    <p className="text-sm text-slate-400 mb-2">Items</p>
                                    <div className="space-y-3">
                                        {selectedOrder.items?.map((item) => (
                                            <div key={item.id} className="flex justify-between p-3 bg-dark-700/50 rounded-lg">
                                                <div>
                                                    <p className="text-white">{item.product_name}</p>
                                                    <p className="text-sm text-slate-400">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="text-white font-medium">{formatPrice(item.subtotal)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="pt-4 border-t border-dark-700">
                                    <div className="flex justify-between text-lg">
                                        <span className="font-semibold text-white">Total</span>
                                        <span className="font-bold text-white">{formatPrice(selectedOrder.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
