'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { Package, MapPin, CreditCard, ChevronRight, Loader2, CheckCircle, XCircle, Clock, Truck } from 'lucide-react';
import { api, Order } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDateTime, getStatusBgColor, getStatusLabel, cn } from '@/lib/utils';
import { useAuth } from '@/lib/context';

// Declare snap on window
declare global {
    interface Window {
        snap: any;
    }
}

export default function OrderDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const orderId = params.id as string;
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaymentPending, setIsPaymentPending] = useState(searchParams.get('payment') === 'pending');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isSnapReady, setIsSnapReady] = useState(false);

    // Load Midtrans Snap script
    useEffect(() => {
        const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
        console.log('Midtrans Client Key:', clientKey ? 'Found: ' + clientKey.substring(0, 15) + '...' : 'NOT FOUND');

        if (!clientKey) {
            console.error('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY is not set in .env.local');
            return;
        }

        // Check if script already loaded
        if (window.snap) {
            console.log('Snap already loaded');
            setIsSnapReady(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', clientKey);
        script.onload = () => {
            console.log('Midtrans Snap script loaded');
            setIsSnapReady(true);
        };
        script.onerror = () => {
            console.error('Failed to load Midtrans Snap script');
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup if needed
        };
    }, []);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await api.getOrder(orderId);
                setOrder(data);

                // If payment is pending, check status
                if (data.status === 'pending' && isPaymentPending) {
                    // In a real app, you'd integrate Midtrans Snap here
                    // For sandbox, we'll show a simulate button
                }
            } catch (error) {
                console.error('Failed to fetch order:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchOrder();
        }
    }, [orderId, isAuthenticated, isPaymentPending]);

    const handlePayment = async () => {
        if (!isSnapReady || !window.snap) {
            alert('Payment system is still loading. Please wait a moment and try again.');
            console.error('Snap not ready. isSnapReady:', isSnapReady, 'window.snap:', window.snap);
            return;
        }

        setIsProcessingPayment(true);
        try {
            // Get Snap Token from backend
            const response = await api.createPayment(orderId);
            console.log('Payment response:', response);

            if (response.snap_token) {
                // Trigger Snap Popup
                window.snap.pay(response.snap_token, {
                    onSuccess: async function (result: any) {
                        console.log('Payment success:', result);
                        // For localhost: simulate payment to update backend
                        // (Midtrans webhook can't reach localhost)
                        try {
                            await api.simulatePayment(orderId);
                        } catch (e) {
                            console.log('Simulate already done or error:', e);
                        }
                        window.location.reload();
                    },
                    onPending: function (result: any) {
                        console.log('Payment pending:', result);
                        window.location.reload();
                    },
                    onError: function (result: any) {
                        console.error('Payment error:', result);
                        alert("Payment failed!");
                    },
                    onClose: function () {
                        console.log('Popup closed without finishing payment');
                    }
                });
            }
        } catch (error) {
            console.error('Failed to initiate payment:', error);
            alert('Failed to initiate payment. Please try again.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Auto-trigger payment if redirected from checkout
    useEffect(() => {
        if (order && order.status === 'pending' && isPaymentPending && !isProcessingPayment) {
            // Optional: automatically open popup
            // handlePayment();
        }
    }, [order, isPaymentPending]);

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Order Not Found</h2>
                    <p className="text-slate-400 mb-6">This order doesn&apos;t exist or you don&apos;t have access.</p>
                    <Button href="/account/orders">View All Orders</Button>
                </div>
            </div>
        );
    }

    const statusIcon = {
        pending: Clock,
        paid: CheckCircle,
        processing: Package,
        shipped: Truck,
        delivered: CheckCircle,
        cancelled: XCircle,
    }[order.status] || Clock;

    const StatusIcon = statusIcon;

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
                    <Link href="/account" className="hover:text-white">Account</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href="/account/orders" className="hover:text-white">Orders</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-white">Order #{order.order_number}</span>
                </nav>

                {/* Payment Banner */}
                {order.status === 'pending' && isPaymentPending && (
                    <div className="card p-6 mb-8 border-yellow-500/50 bg-yellow-500/5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Complete Your Payment</h3>
                                    <p className="text-sm text-slate-400">
                                        Your order is awaiting payment. Complete it to proceed.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handlePayment}
                                isLoading={isProcessingPayment}
                                variant="secondary"
                            >
                                Pay Now
                            </Button>
                        </div>
                    </div>
                )}

                {/* Order Header */}
                <div className="card p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="font-display text-2xl font-bold text-white">
                                Order #{order.order_number}
                            </h1>
                            <p className="text-slate-400 mt-1">
                                Placed on {formatDateTime(order.created_at)}
                            </p>
                        </div>
                        <div className={cn('px-4 py-2 rounded-full flex items-center gap-2', getStatusBgColor(order.status))}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="font-medium">{getStatusLabel(order.status)}</span>
                        </div>
                    </div>

                    {/* Order Status Timeline */}
                    {order.status === 'cancelled' ? (
                        // Cancelled order - show simple cancelled status
                        <div className="flex items-center justify-center py-4">
                            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-red-500/10">
                                <XCircle className="w-6 h-6 text-red-500" />
                                <span className="text-red-500 font-medium">Order Cancelled</span>
                            </div>
                        </div>
                    ) : (
                        // Normal order timeline
                        <div className="flex items-center justify-between relative">
                            <div className="absolute top-4 left-0 right-0 h-0.5 bg-dark-700" />
                            {['pending', 'paid', 'processing', 'shipped', 'delivered'].map((status, index) => {
                                const isCompleted = ['pending', 'paid', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= index;
                                const isCurrent = order.status === status;
                                return (
                                    <div key={status} className="relative flex flex-col items-center">
                                        <div
                                            className={cn(
                                                'w-8 h-8 rounded-full flex items-center justify-center z-10',
                                                isCompleted
                                                    ? 'bg-primary text-white'
                                                    : 'bg-dark-700 text-slate-500'
                                            )}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <span className="text-xs">{index + 1}</span>
                                            )}
                                        </div>
                                        <span
                                            className={cn(
                                                'text-xs mt-2 text-center',
                                                isCurrent ? 'text-primary font-medium' : 'text-slate-500'
                                            )}
                                        >
                                            {getStatusLabel(status)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Cancel Button for Pending Orders */}
                    {order.status === 'pending' && (
                        <div className="mt-6 pt-6 border-t border-dark-700 flex justify-end">
                            <Button
                                variant="outline"
                                className="text-red-400 border-red-500/50 hover:bg-red-500/10"
                                onClick={async () => {
                                    if (!confirm('Are you sure you want to cancel this order?')) return;
                                    try {
                                        await api.cancelOrder(order.id);
                                        window.location.reload();
                                    } catch (error) {
                                        console.error('Failed to cancel order:', error);
                                        alert('Failed to cancel order');
                                    }
                                }}
                            >
                                <XCircle className="w-4 h-4" />
                                Cancel Order
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
                        <div className="card p-6">
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary" />
                                Order Items ({order.items.length})
                            </h3>
                            <div className="space-y-4">
                                {order.items.map((item) => {
                                    const image = item.product?.images?.[0];
                                    return (
                                        <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-dark-700/50">
                                            <div className="relative w-20 h-20 rounded-lg bg-dark-600 overflow-hidden flex-shrink-0">
                                                {image && (
                                                    <Image src={image.url} alt="" fill className="object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white">{item.product_name}</p>
                                                {item.variant_info && (
                                                    <p className="text-sm text-slate-400">{item.variant_info}</p>
                                                )}
                                                <p className="text-sm text-slate-400">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-white">{formatPrice(item.subtotal)}</p>
                                                <p className="text-xs text-slate-500">{formatPrice(item.price)} each</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Delivery Address */}
                        {order.address && (
                            <div className="card p-6">
                                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    Delivery Address
                                </h3>
                                <p className="text-slate-300">{order.address.name}</p>
                                <p className="text-slate-400 text-sm">{order.address.phone}</p>
                                <p className="text-slate-400 text-sm mt-2">
                                    {order.address.street}<br />
                                    {order.address.city}, {order.address.state} {order.address.postal_code}
                                </p>
                            </div>
                        )}

                        {/* Tracking Number - Show when shipped or delivered */}
                        {(order.status === 'shipped' || order.status === 'delivered') && order.tracking_number && (
                            <div className="card p-6">
                                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                    <Truck className="w-5 h-5 text-primary" />
                                    Shipping Info
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-slate-400">Tracking Number</p>
                                        <p className="font-mono text-white text-lg">{order.tracking_number}</p>
                                    </div>
                                    {order.shipped_at && (
                                        <div>
                                            <p className="text-sm text-slate-400">Shipped On</p>
                                            <p className="text-slate-300">{formatDateTime(order.shipped_at)}</p>
                                        </div>
                                    )}
                                    {order.delivered_at && (
                                        <div>
                                            <p className="text-sm text-slate-400">Delivered On</p>
                                            <p className="text-slate-300">{formatDateTime(order.delivered_at)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Order Summary */}
                        <div className="card p-6">
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Payment Summary
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-slate-400">
                                    <span>Subtotal</span>
                                    <span className="text-white">{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Shipping</span>
                                    <span className="text-white">{formatPrice(order.shipping_fee)}</span>
                                </div>
                                <div className="flex justify-between pt-3 border-t border-dark-700">
                                    <span className="font-semibold text-white">Total</span>
                                    <span className="font-bold text-white text-lg">{formatPrice(order.total)}</span>
                                </div>
                                {order.payment && (
                                    <div className="pt-3 border-t border-dark-700">
                                        <p className="text-sm text-slate-400">
                                            Payment: <span className={getStatusBgColor(order.payment.status).split(' ')[1]}>
                                                {getStatusLabel(order.payment.status)}
                                            </span>
                                        </p>
                                        {order.payment.method && (
                                            <p className="text-sm text-slate-400">Method: {order.payment.method}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
