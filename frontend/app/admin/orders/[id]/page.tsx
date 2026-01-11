'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowLeft,
    Package,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    MapPin,
    CreditCard,
    User,
    Phone,
    Mail,
    Loader2
} from 'lucide-react';
import { api, Order } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    pending: { label: 'Pending Payment', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    paid: { label: 'Paid', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    processing: { label: 'Processing', icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    shipped: { label: 'Shipped', icon: Truck, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
};

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [showShippingForm, setShowShippingForm] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await api.adminGetOrderDetail(orderId);
                setOrder(data);
                setTrackingNumber(data.tracking_number || '');
            } catch (error) {
                console.error('Failed to fetch order:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    const updateStatus = async (status: string, tracking?: string) => {
        if (!order) return;
        setIsUpdating(true);
        try {
            await api.adminUpdateOrderStatus(orderId, status, tracking);
            const updated = await api.adminGetOrderDetail(orderId);
            setOrder(updated);
            setShowShippingForm(false);
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update order status');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-400">Order not found</p>
            </div>
        );
    }

    const status = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const isGuest = !order.user_id;
    const customerName = isGuest ? order.guest_name : order.user?.name;
    const customerEmail = isGuest ? order.guest_email : order.user?.email;
    const customerPhone = isGuest ? order.guest_phone : order.address?.phone;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/orders" className="p-2 rounded-lg hover:bg-dark-700 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="font-display text-2xl font-bold text-white">
                        Order #{order.order_number || order.id.slice(0, 8)}
                    </h1>
                    <p className="text-slate-400 text-sm">{formatDateTime(order.created_at)}</p>
                </div>
                <div className={cn('flex items-center gap-2 px-4 py-2 rounded-full', status.bg)}>
                    <StatusIcon className={cn('w-5 h-5', status.color)} />
                    <span className={cn('font-medium', status.color)}>{status.label}</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="card p-6">
                        <h2 className="font-semibold text-white mb-4">Order Items ({order.items?.length || 0})</h2>
                        <div className="space-y-4">
                            {order.items?.map((item) => (
                                <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-dark-700/50">
                                    <div className="w-16 h-16 rounded-lg bg-dark-600 overflow-hidden flex-shrink-0">
                                        {item.product?.images?.[0] && (
                                            <Image
                                                src={item.product.images[0].url}
                                                alt=""
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{item.product_name}</p>
                                        {item.variant_info && (
                                            <p className="text-sm text-slate-400">{item.variant_info}</p>
                                        )}
                                        <p className="text-sm text-slate-400">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-white">{formatPrice(item.subtotal)}</p>
                                        <p className="text-xs text-slate-500">{formatPrice(item.price)} each</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Form */}
                    {showShippingForm && (
                        <div className="card p-6">
                            <h2 className="font-semibold text-white mb-4">Shipping Details</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Tracking Number</label>
                                    <input
                                        type="text"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        placeholder="Enter tracking number"
                                        className="input w-full"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => updateStatus('shipped', trackingNumber)}
                                        isLoading={isUpdating}
                                    >
                                        <Truck className="w-4 h-4" />
                                        Mark as Shipped
                                    </Button>
                                    <Button variant="ghost" onClick={() => setShowShippingForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="card p-6">
                        <h2 className="font-semibold text-white mb-4">Actions</h2>
                        <div className="flex flex-wrap gap-3">
                            {order.status === 'processing' && (
                                <Button onClick={() => setShowShippingForm(true)}>
                                    <Truck className="w-4 h-4" />
                                    Ship Order
                                </Button>
                            )}
                            {order.status === 'shipped' && (
                                <Button onClick={() => updateStatus('delivered')} isLoading={isUpdating}>
                                    <CheckCircle className="w-4 h-4" />
                                    Mark Delivered
                                </Button>
                            )}
                            {order.status === 'paid' && (
                                <Button onClick={() => updateStatus('processing')} isLoading={isUpdating}>
                                    <Package className="w-4 h-4" />
                                    Process Order
                                </Button>
                            )}
                            {order.status === 'pending' && (
                                <>
                                    <Button variant="danger" onClick={() => updateStatus('cancelled')} isLoading={isUpdating}>
                                        <XCircle className="w-4 h-4" />
                                        Cancel Order
                                    </Button>
                                </>
                            )}
                        </div>
                        {order.tracking_number && (
                            <div className="mt-4 p-3 rounded-lg bg-dark-700/50">
                                <p className="text-sm text-slate-400">Tracking Number</p>
                                <p className="font-mono text-white">{order.tracking_number}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="card p-6">
                        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Customer
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-medium">
                                    {customerName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-white">{customerName}</p>
                                    <p className="text-xs text-slate-400">{isGuest ? 'Guest' : 'Registered'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">{customerEmail}</span>
                            </div>
                            {customerPhone && (
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm">{customerPhone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="card p-6">
                        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Shipping Address
                        </h2>
                        {isGuest ? (
                            <p className="text-slate-300 text-sm whitespace-pre-line">{order.guest_address}</p>
                        ) : order.address ? (
                            <div className="text-sm text-slate-300 space-y-1">
                                <p className="font-medium text-white">{order.address.name}</p>
                                <p>{order.address.phone}</p>
                                <p>{order.address.street}</p>
                                <p>{order.address.city}, {order.address.state} {order.address.postal_code}</p>
                            </div>
                        ) : (
                            <p className="text-slate-500">No address</p>
                        )}
                    </div>

                    {/* Payment */}
                    <div className="card p-6">
                        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" />
                            Payment
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Method</span>
                                <span className="text-white capitalize">{order.payment?.method || 'Pending'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Status</span>
                                <span className={cn(
                                    'capitalize',
                                    order.payment?.status === 'success' ? 'text-emerald-500' : 'text-amber-500'
                                )}>
                                    {order.payment?.status || 'Pending'}
                                </span>
                            </div>
                            <hr className="border-dark-600 my-2" />
                            <div className="flex justify-between">
                                <span className="text-slate-400">Subtotal</span>
                                <span className="text-white">{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Shipping</span>
                                <span className="text-white">{formatPrice(order.shipping_fee)}</span>
                            </div>
                            <hr className="border-dark-600 my-2" />
                            <div className="flex justify-between font-semibold">
                                <span className="text-white">Total</span>
                                <span className="text-primary">{formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
