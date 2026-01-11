'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Package, Loader2, ArrowRight } from 'lucide-react';
import { api, Order } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending Payment', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    processing: { label: 'Processing', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    shipped: { label: 'Shipped', color: 'text-violet-500', bg: 'bg-violet-500/10' },
    delivered: { label: 'Delivered', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    cancelled: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-500/10' },
};

export default function TrackOrderPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
    const [email, setEmail] = useState('');
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderNumber || !email) return;

        setIsLoading(true);
        setError('');
        setOrder(null);

        try {
            const data = await api.trackGuestOrder(orderNumber, email);
            setOrder(data);
        } catch (err: any) {
            setError(err.message || 'Order not found. Please check your order number and email.');
        } finally {
            setIsLoading(false);
        }
    };

    const status = order ? statusConfig[order.status] || statusConfig.pending : null;

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="font-display text-3xl font-bold text-white mb-2">Track Your Order</h1>
                    <p className="text-slate-400">Enter your order number and email to check status</p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleTrack} className="card p-6 mb-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Order Number</label>
                            <input
                                type="text"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                                placeholder="e.g., LKY-123456"
                                className="input w-full font-mono"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="input w-full"
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}
                        <Button type="submit" isLoading={isLoading} fullWidth>
                            <Search className="w-4 h-4" />
                            Track Order
                        </Button>
                    </div>
                </form>

                {/* Order Result */}
                {order && status && (
                    <div className="card p-6 space-y-6">
                        {/* Order Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Order Number</p>
                                <p className="text-xl font-bold text-white font-mono">{order.order_number}</p>
                            </div>
                            <div className={cn('px-4 py-2 rounded-full', status.bg)}>
                                <span className={cn('font-medium', status.color)}>{status.label}</span>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="border-t border-dark-700 pt-6">
                            <p className="text-sm text-slate-400 mb-4">Order Timeline</p>
                            <div className="space-y-4">
                                <TimelineItem
                                    done={true}
                                    label="Order Placed"
                                    date={order.created_at}
                                />
                                <TimelineItem
                                    done={order.status !== 'pending' && order.status !== 'cancelled'}
                                    label="Payment Received"
                                    date={order.payment?.paid_at}
                                />
                                <TimelineItem
                                    done={['shipped', 'delivered'].includes(order.status)}
                                    label="Shipped"
                                    date={order.shipped_at}
                                    extra={order.tracking_number ? `Tracking: ${order.tracking_number}` : undefined}
                                />
                                <TimelineItem
                                    done={order.status === 'delivered'}
                                    label="Delivered"
                                    date={order.delivered_at}
                                    isLast
                                />
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="border-t border-dark-700 pt-6">
                            <p className="text-sm text-slate-400 mb-4">Order Summary</p>
                            <div className="space-y-3">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-slate-300">{item.product_name} x {item.quantity}</span>
                                        <span className="text-white">{formatPrice(item.subtotal)}</span>
                                    </div>
                                ))}
                                <hr className="border-dark-600" />
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Subtotal</span>
                                    <span className="text-white">{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Shipping</span>
                                    <span className="text-white">{formatPrice(order.shipping_fee)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span className="text-white">Total</span>
                                    <span className="text-primary">{formatPrice(order.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {order.guest_address && (
                            <div className="border-t border-dark-700 pt-6">
                                <p className="text-sm text-slate-400 mb-2">Shipping To</p>
                                <p className="text-slate-300 whitespace-pre-line">{order.guest_address}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* CTA */}
                <div className="text-center mt-8">
                    <p className="text-slate-400 mb-4">Want to create an account for easier tracking?</p>
                    <Link href="/auth/register">
                        <Button variant="outline" size="sm">
                            Create Account
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function TimelineItem({ done, label, date, extra, isLast }: { done: boolean; label: string; date?: string; extra?: string; isLast?: boolean }) {
    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className={cn(
                    'w-4 h-4 rounded-full border-2',
                    done ? 'bg-primary border-primary' : 'border-dark-600'
                )} />
                {!isLast && <div className={cn('w-0.5 h-8', done ? 'bg-primary' : 'bg-dark-600')} />}
            </div>
            <div className="flex-1 -mt-1">
                <p className={cn('font-medium', done ? 'text-white' : 'text-slate-500')}>{label}</p>
                {date && <p className="text-xs text-slate-400">{formatDateTime(date)}</p>}
                {extra && <p className="text-xs text-primary font-mono mt-1">{extra}</p>}
            </div>
        </div>
    );
}
