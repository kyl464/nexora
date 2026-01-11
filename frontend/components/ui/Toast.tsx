'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { X, CheckCircle, ShoppingCart, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'cart';
    title: string;
    message?: string;
}

interface ToastContextType {
    showToast: (toast: Omit<Toast, 'id'>) => void;
    showCartToast: (productName: string) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { ...toast, id }]);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const showCartToast = useCallback((productName: string) => {
        showToast({
            type: 'cart',
            title: 'Added to Cart!',
            message: productName,
        });
    }, [showToast]);

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, showCartToast, hideToast }}>
            {children}

            {/* Modal Popup with Blur Background */}
            {toasts.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop blur */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => hideToast(toasts[0].id)}
                    />

                    {/* Popup Content */}
                    <div className="relative z-10 animate-scale-in">
                        {toasts.slice(0, 1).map((toast) => (
                            <div
                                key={toast.id}
                                className={cn(
                                    'bg-dark-800 border-2 rounded-2xl shadow-2xl p-8 min-w-[320px] max-w-md',
                                    toast.type === 'success' && 'border-emerald-500/50',
                                    toast.type === 'error' && 'border-red-500/50',
                                    toast.type === 'cart' && 'border-primary/50'
                                )}
                            >
                                {/* Close button */}
                                <button
                                    onClick={() => hideToast(toast.id)}
                                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Icon */}
                                <div className="flex flex-col items-center text-center">
                                    {toast.type === 'success' && (
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                                        </div>
                                    )}
                                    {toast.type === 'error' && (
                                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                                            <AlertCircle className="w-8 h-8 text-red-500" />
                                        </div>
                                    )}
                                    {toast.type === 'cart' && (
                                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                            <ShoppingCart className="w-8 h-8 text-primary" />
                                        </div>
                                    )}

                                    {/* Title & Message */}
                                    <h3 className="text-xl font-bold text-white mb-2">{toast.title}</h3>
                                    {toast.message && (
                                        <p className="text-slate-400 mb-6">{toast.message}</p>
                                    )}

                                    {/* Cart actions */}
                                    {toast.type === 'cart' && (
                                        <div className="flex gap-3 w-full">
                                            <Link
                                                href="/cart"
                                                className="flex-1 btn btn-primary text-center py-3"
                                                onClick={() => hideToast(toast.id)}
                                            >
                                                View Cart
                                            </Link>
                                            <button
                                                onClick={() => hideToast(toast.id)}
                                                className="flex-1 btn btn-outline py-3"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    )}

                                    {/* Success/Error close button */}
                                    {toast.type !== 'cart' && (
                                        <button
                                            onClick={() => hideToast(toast.id)}
                                            className="btn btn-primary px-8 py-3"
                                        >
                                            OK
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
