'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Package, Heart, MapPin, ChevronRight, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const accountLinks = [
    { href: '/account', label: 'Profile', icon: User },
    { href: '/account/orders', label: 'My Orders', icon: Package },
    { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
    { href: '/account/addresses', label: 'Addresses', icon: MapPin },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isAuthenticated, isLoading, logout, login } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-dark-700 rounded mb-8" />
                        <div className="grid lg:grid-cols-4 gap-8">
                            <div className="lg:col-span-1">
                                <div className="h-64 bg-dark-700 rounded-2xl" />
                            </div>
                            <div className="lg:col-span-3">
                                <div className="h-96 bg-dark-700 rounded-2xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10 text-slate-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Sign in to continue</h2>
                    <p className="text-slate-400 mb-6">
                        Access your account, orders, and wishlist
                    </p>
                    <Button onClick={login}>Sign In with Google</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="font-display text-3xl font-bold text-white mb-8">My Account</h1>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-1">
                        <div className="card p-6 sticky top-24">
                            {/* User Info */}
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-dark-700">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-14 h-14 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
                                        <User className="w-7 h-7 text-white" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="font-semibold text-white truncate">{user?.name}</p>
                                    <p className="text-sm text-slate-400 truncate">{user?.email}</p>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-1">
                                {accountLinks.map((link) => {
                                    const Icon = link.icon;
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={cn(
                                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                                                isActive
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-slate-400 hover:text-white hover:bg-dark-700'
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {link.label}
                                            <ChevronRight className="w-4 h-4 ml-auto" />
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Logout */}
                            <button
                                onClick={logout}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-dark-700 w-full mt-4"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </div>
                    </aside>

                    {/* Content */}
                    <main className="lg:col-span-3">{children}</main>
                </div>
            </div>
        </div>
    );
}
