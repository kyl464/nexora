'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, MapPin, CreditCard, Loader2, User, Mail, Phone, Home } from 'lucide-react';
import { api, Address } from '@/lib/api';
import { useAuth, useCart } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { formatPrice, cn } from '@/lib/utils';

export default function CheckoutPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { cart, guestCart, refreshCart, clearCart } = useCart();

    // For authenticated users
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
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

    // For guest users
    const [guestInfo, setGuestInfo] = useState({
        email: '',
        name: '',
        phone: '',
        address: '',
    });

    const [notes, setNotes] = useState('');
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

    // Get cart items (either from auth cart or guest cart)
    const items = isAuthenticated
        ? (cart?.items || [])
        : guestCart.filter(item => item.product).map(item => ({
            id: item.productId,
            product: item.product!,
            quantity: item.quantity,
            variant: null,
        }));

    const subtotal = isAuthenticated
        ? (cart?.subtotal || 0)
        : guestCart.reduce((sum, item) => sum + (item.product?.base_price || 0) * item.quantity, 0);

    const shippingFee = subtotal > 500000 ? 0 : 15000;
    const total = subtotal + shippingFee;

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

    // Redirect if cart is empty
    useEffect(() => {
        if (!authLoading && items.length === 0) {
            router.push('/cart');
        }
    }, [authLoading, items.length, router]);

    // Fetch addresses for authenticated users
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
        } else {
            setIsLoadingAddresses(false);
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
        if (isAuthenticated) {
            // Authenticated checkout
            if (!selectedAddressId) {
                alert('Please select or add a delivery address');
                return;
            }

            setIsCreatingOrder(true);
            try {
                const order = await api.createOrder(selectedAddressId, notes);
                console.log('Order created:', order);

                const payment = await api.createPayment(order.id);
                console.log('Payment created:', payment);

                await refreshCart();

                if (payment.snap_token && (window as any).snap) {
                    (window as any).snap.pay(payment.snap_token, {
                        onSuccess: async function (result: any) {
                            console.log('Payment success:', result);
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
                    window.location.href = payment.redirect_url;
                } else {
                    router.push(`/orders/${order.id}?payment=pending`);
                }
            } catch (error) {
                console.error('Failed to create order:', error);
                alert('Failed to create order. Please try again.');
            } finally {
                setIsCreatingOrder(false);
            }
        } else {
            // Guest checkout
            if (!guestInfo.email || !guestInfo.name || !guestInfo.phone || !guestInfo.address) {
                alert('Please fill in all required fields');
                return;
            }

            setIsCreatingOrder(true);
            try {
                const orderData = {
                    guest_email: guestInfo.email,
                    guest_name: guestInfo.name,
                    guest_phone: guestInfo.phone,
                    guest_address: guestInfo.address,
                    notes: notes,
                    items: guestCart.map(item => ({
                        product_id: item.productId,
                        quantity: item.quantity,
                    })),
                };

                const order = await api.createGuestOrder(orderData);
                console.log('Guest order created:', order);

                // Create payment for guest order
                const payment = await api.createGuestPayment(order.id);
                console.log('Guest payment created:', payment);

                // Clear guest cart
                await clearCart();

                // Open Midtrans Snap popup
                if (payment.snap_token && (window as any).snap) {
                    (window as any).snap.pay(payment.snap_token, {
                        onSuccess: function (result: any) {
                            console.log('Guest payment success:', result);
                            alert(`Payment successful! Your order number is: ${order.order_number}`);
                            router.push(`/track-order?order=${order.order_number}&email=${guestInfo.email}`);
                        },
                        onPending: function (result: any) {
                            console.log('Guest payment pending:', result);
                            alert(`Payment pending. Your order number is: ${order.order_number}`);
                            router.push(`/track-order?order=${order.order_number}&email=${guestInfo.email}`);
                        },
                        onError: function (result: any) {
                            console.error('Guest payment error:', result);
                            alert('Payment failed! Please try again.');
                        },
                        onClose: function () {
                            console.log('Guest payment popup closed');
                            alert(`Order created! Your order number is: ${order.order_number}. Complete payment to process your order.`);
                            router.push(`/track-order?order=${order.order_number}&email=${guestInfo.email}`);
                        }
                    });
                } else if (payment.redirect_url) {
                    window.location.href = payment.redirect_url;
                } else {
                    alert(`Order created! Your order number is: ${order.order_number}`);
                    router.push(`/track-order?order=${order.order_number}&email=${guestInfo.email}`);
                }
            } catch (error) {
                console.error('Failed to create guest order:', error);
                alert('Failed to create order. Please try again.');
            } finally {
                setIsCreatingOrder(false);
            }
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="font-display text-3xl font-bold text-white mb-8">Checkout</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {isAuthenticated ? (
                            /* Authenticated User - Address Selection */
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
                        ) : (
                            /* Guest User - Info Form */
                            <div className="card p-6">
                                <h2 className="font-semibold text-white text-lg flex items-center gap-2 mb-6">
                                    <User className="w-5 h-5 text-primary" />
                                    Guest Checkout
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">
                                            <Mail className="w-4 h-4 inline mr-2" />
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            value={guestInfo.email}
                                            onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                                            className="input w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">
                                            <User className="w-4 h-4 inline mr-2" />
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={guestInfo.name}
                                            onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                            className="input w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">
                                            <Phone className="w-4 h-4 inline mr-2" />
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="+62 812 3456 7890"
                                            value={guestInfo.phone}
                                            onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                            className="input w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">
                                            <Home className="w-4 h-4 inline mr-2" />
                                            Delivery Address *
                                        </label>
                                        <textarea
                                            placeholder="Full address including street, city, postal code"
                                            value={guestInfo.address}
                                            onChange={(e) => setGuestInfo({ ...guestInfo, address: e.target.value })}
                                            rows={3}
                                            className="input w-full resize-none"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Order Notes */}
                        <div className="card p-6">
                            <h2 className="font-semibold text-white text-lg mb-4">Order Notes (Optional)</h2>
                            <textarea
                                placeholder="Add any special instructions for your order..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="input resize-none w-full"
                            />
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="card p-6 sticky top-24">
                            <h3 className="font-semibold text-white text-lg mb-6">Order Summary</h3>

                            {/* Items */}
                            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                                {items.map((item) => {
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
                                disabled={isAuthenticated ? (!selectedAddressId || addresses.length === 0) : (!guestInfo.email || !guestInfo.name || !guestInfo.phone || !guestInfo.address)}
                                fullWidth
                                size="lg"
                            >
                                <CreditCard className="w-5 h-5" />
                                {isAuthenticated ? 'Place Order' : 'Place Guest Order'}
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
