'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Heart, User, Search, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth, useCart } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Header() {
    const pathname = usePathname();
    const { user, isAuthenticated, login, logout } = useAuth();
    const { cartCount } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/products', label: 'Products' },
        { href: '/categories', label: 'Categories' },
    ];

    return (
        <header className="sticky top-0 z-50 glass border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                            <span className="text-white font-display font-bold text-xl">N</span>
                        </div>
                        <span className="font-display font-bold text-xl text-white hidden sm:block">
                            Nexora
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                    pathname === link.href
                                        ? 'text-white bg-dark-700'
                                        : 'text-slate-400 hover:text-white hover:bg-dark-800'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-2">
                        {/* Search */}
                        <Link
                            href="/search"
                            className="btn btn-ghost btn-icon"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5" />
                        </Link>

                        {/* Wishlist */}
                        {isAuthenticated && (
                            <Link
                                href="/account/wishlist"
                                className="btn btn-ghost btn-icon"
                                aria-label="Wishlist"
                            >
                                <Heart className="w-5 h-5" />
                            </Link>
                        )}

                        {/* Cart */}
                        <Link
                            href="/cart"
                            className="btn btn-ghost btn-icon relative"
                            aria-label="Cart"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </Link>

                        {/* User */}
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-dark-700 transition-colors"
                                >
                                    {user?.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="w-8 h-8 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </button>

                                {isUserMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-dark-800 border border-dark-700 shadow-xl z-20 py-1 animate-scale-in">
                                            <div className="px-4 py-3 border-b border-dark-700">
                                                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                            </div>
                                            <Link
                                                href="/account"
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-dark-700"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <User className="w-4 h-4" />
                                                My Account
                                            </Link>
                                            <Link
                                                href="/account/orders"
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-dark-700"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                My Orders
                                            </Link>
                                            <Link
                                                href="/account/wishlist"
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-dark-700"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <Heart className="w-4 h-4" />
                                                Wishlist
                                            </Link>
                                            <div className="border-t border-dark-700 mt-1 pt-1">
                                                <button
                                                    onClick={() => {
                                                        setIsUserMenuOpen(false);
                                                        logout();
                                                    }}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-dark-700 w-full"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Button onClick={login} size="sm">
                                Sign In
                            </Button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden btn btn-ghost btn-icon"
                        aria-label="Menu"
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-dark-700 animate-slide-down">
                        <nav className="flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={cn(
                                        'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                        pathname === link.href
                                            ? 'text-white bg-dark-700'
                                            : 'text-slate-400 hover:text-white hover:bg-dark-800'
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-700">
                            <Link href="/search" className="btn btn-ghost btn-icon" onClick={() => setIsMenuOpen(false)}>
                                <Search className="w-5 h-5" />
                            </Link>
                            <Link href="/cart" className="btn btn-ghost btn-icon relative" onClick={() => setIsMenuOpen(false)}>
                                <ShoppingCart className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                            {isAuthenticated ? (
                                <Link href="/account" className="btn btn-ghost btn-icon" onClick={() => setIsMenuOpen(false)}>
                                    <User className="w-5 h-5" />
                                </Link>
                            ) : (
                                <Button onClick={login} size="sm" className="ml-auto">
                                    Sign In
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
