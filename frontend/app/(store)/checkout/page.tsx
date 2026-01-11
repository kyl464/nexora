'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { api, Address } from '@/lib/api';
import { useAuth, useCart } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { formatPrice, cn } from '@/lib/utils';

export default function CheckoutPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { cart, refreshCart } = useCart();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: '',
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Indonesia',
        is_default: false,
    });

    // Load Midtrans Snap script
    useEffect(() => {
        const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
        if (!clientKey || (window as any).snap) return;

        const script = document.createElement('script');
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', clientKey);
        script.onload = () => console.log('Midtrans Snap loaded in checkout');
        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/cart');
            return;
        }

        if (!authLoading && (!cart || cart.items.length === 0)) {
            router.push('/cart');
            return;
        }
    }, [authLoading, isAuthenticated, cart, router]);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const data = await api.getAddresses();
                setAddresses(data);
                const defaultAddress = data.find((a) => a.is_default);
                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress.id);
                } else if (data.length > 0) {
                    setSelectedAddressId(data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch addresses:', error);
            } finally {
                setIsLoadingAddresses(false);
            }
        };

        if (isAuthenticated) {
            fetchAddresses();
        }
    }, [isAuthenticated]);

    const handleAddAddress = async () => {
        try {
            const address = await api.createAddress(newAddress);
            setAddresses([...addresses, address]);
            setSelectedAddressId(address.id);
            setShowAddressForm(false);
            setNewAddress({
                label: '',
                name: '',
                phone: '',
                street: '',
                city: '',
                state: '',
                postal_code: '',
                country: 'Indonesia',
                is_default: false,
            });
        } catch (error) {
            console.error('Failed to add address:', error);
        }
    };

    const handleCheckout = async () => {
        if (!selectedAddressId) {
            alert('Please select or add a delivery address');
            return;
        }

        setIsCreatingOrder(true);
        try {
            // Create order
            const order = await api.createOrder(selectedAddressId, notes);
            console.log('Order created:', order);

            // Create payment
            const payment = await api.createPayment(order.id);
            console.log('Payment created:', payment);

            // Refresh cart
            await refreshCart();

            // Trigger Snap popup or redirect
            if (payment.snap_token && (window as any).snap) {
                (window as any).snap.pay(payment.snap_token, {
                    onSuccess: async function (result: any) {
                        console.log('Payment success:', result);
                        // For localhost: simulate payment to update backend
                        try {
                            await api.simulatePayment(order.id);
                        } catch (e) {
                            console.log('Simulate done or error:', e);
                        }
                        router.push(`/orders/${order.id}`);
                    },
                    onPending: function (result: any) {
                        console.log('Payment pending:', result);
                        router.push(`/orders/${order.id}?payment=pending`);
                    },
                    onError: function (result: any) {
                        console.error('Payment error:', result);
                        alert('Payment failed!');
                        router.push(`/orders/${order.id}`);
                    },
                    onClose: function () {
                        console.log('Popup closed');
                        router.push(`/orders/${order.id}?payment=pending`);
                    }
                });
            } else if (payment.redirect_url) {
                // Fallback to redirect URL if Snap not loaded
                window.location.href = payment.redirect_url;
            } else {
                // Fallback to order page
                router.push(`/orders/${order.id}?payment=pending`);
            }
        } catch (error) {
            console.error('Failed to create order:', error);
            alert('Failed to create order. Please try again.');
        } finally {
            setIsCreatingOrder(false);
        }
    };

    if (authLoading || !cart) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const subtotal = cart.subtotal;
    const shippingFee = subtotal > 500000 ? 0 : 15000;
    const total = subtotal + shippingFee;

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="font-display text-3xl font-bold text-white mb-8">Checkout</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Delivery Address */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-semibold text-white text-lg flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    Delivery Address
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAddressForm(!showAddressForm)}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add New
                                </Button>
                            </div>

                            {/* Add Address Form */}
                            {showAddressForm && (
                                <div className="mb-6 p-4 rounded-xl bg-dark-700/50 border border-dark-600">
                                    <h4 className="font-medium text-white mb-4">New Address</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Label (e.g., Home, Office)"
                                            value={newAddress.label}
                                            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                            className="input"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Recipient Name"
                                            value={newAddress.name}
                                            onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                            className="input"
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            value={newAddress.phone}
                                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                            className="input"
                                        />
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={newAddress.city}
                                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                            className="input"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Street Address"
                                            value={newAddress.street}
                                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                            className="input sm:col-span-2"
                                        />
                                        <input
                                            type="text"
                                            placeholder="State/Province"
                                            value={newAddress.state}
                                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                            className="input"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Postal Code"
                                            value={newAddress.postal_code}
                                            onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Button onClick={handleAddAddress} size="sm">
                                            Save Address
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setShowAddressForm(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Address List */}
                            {isLoadingAddresses ? (
                                <div className="space-y-3">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="h-24 bg-dark-700 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : addresses.length > 0 ? (
                                <div className="space-y-3">
                                    {addresses.map((address) => (
                                        <button
                                            key={address.id}
                                            onClick={() => setSelectedAddressId(address.id)}
                                            className={cn(
                                                'w-full text-left p-4 rounded-xl border transition-all',
                                                selectedAddressId === address.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-dark-700 hover:border-dark-600'
                                            )}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-white">{address.label}</span>
                                                        {address.is_default && (
                                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-400 mt-1">{address.name}</p>
                                                    <p className="text-sm text-slate-400">{address.phone}</p>
                                                    <p className="text-sm text-slate-400 mt-1">
                                                        {address.street}, {address.city}, {address.state} {address.postal_code}
                                                    </p>
                                                </div>
                                                <div
                                                    className={cn(
                                                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                                                        selectedAddressId === address.id
                                                            ? 'border-primary bg-primary'
                                                            : 'border-dark-600'
                                                    )}
                                                >
                                                    {selectedAddressId === address.id && (
                                                        <div className="w-2 h-2 rounded-full bg-white" />
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-center py-8">
                                    No addresses found. Please add a delivery address.
                                </p>
                            )}
                        </div>

                        {/* Order Notes */}
                        <div className="card p-6">
                            <h2 className="font-semibold text-white text-lg mb-4">Order Notes (Optional)</h2>
                            <textarea
                                placeholder="Add any special instructions for your order..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="input resize-none"
                            />
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="card p-6 sticky top-24">
                            <h3 className="font-semibold text-white text-lg mb-6">Order Summary</h3>

                            {/* Items */}
                            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                                {cart.items.map((item) => {
                                    const image = item.product.images?.[0];
                                    return (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="relative w-16 h-16 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
                                                {image && (
                                                    <Image src={image.url} alt="" fill className="object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">{item.product.name}</p>
                                                <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                                                <p className="text-sm font-medium text-white">
                                                    {formatPrice((item.product.base_price + (item.variant?.price_modifier || 0)) * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 mb-6 pt-4 border-t border-dark-700">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span>Subtotal</span>
                                    <span className="text-white">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-400">
                                    <span>Shipping</span>
                                    <span className="text-white">
                                        {shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-dark-700">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white">Total</span>
                                        <span className="text-xl font-bold text-white">{formatPrice(total)}</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleCheckout}
                                isLoading={isCreatingOrder}
                                disabled={!selectedAddressId || addresses.length === 0}
                                fullWidth
                                size="lg"
                            >
                                <CreditCard className="w-5 h-5" />
                                Place Order
                            </Button>

                            <p className="text-xs text-slate-500 text-center mt-4">
                                By placing this order, you agree to our Terms of Service and Privacy Policy
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
