'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Package,
    ShoppingCart,
    Users,
    DollarSign,
    ArrowRight,
    AlertTriangle
} from 'lucide-react';
import { api, Order, Product } from '@/lib/api';
import { formatPrice, formatDateTime, getStatusBgColor, getStatusLabel } from '@/lib/utils';

interface DashboardStats {
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalUsers: number;
    recentOrders: Order[];
    lowStockProducts: Product[];
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch orders using admin endpoint
                const ordersData = await api.adminGetAllOrders(1);

                // Fetch products
                const productsData = await api.getProducts({ limit: 100 });

                // Fetch users using admin endpoint
                let usersCount = 0;
                try {
                    const users = await api.adminGetAllUsers();
                    usersCount = users?.length || 0;
                } catch (e) {
                    console.log('Could not fetch users count:', e);
                }

                // Calculate stats
                const totalRevenue = (ordersData.orders || [])
                    .filter(o => o.status !== 'cancelled' && o.status !== 'pending')
                    .reduce((sum, o) => sum + o.total, 0);

                const lowStock = productsData.products.filter(p => p.stock < 10);

                setStats({
                    totalOrders: ordersData.total || 0,
                    totalRevenue,
                    totalProducts: productsData.total,
                    totalUsers: usersCount,
                    recentOrders: (ordersData.orders || []).slice(0, 5),
                    lowStockProducts: lowStock.slice(0, 5),
                });
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-dark-800 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Orders',
            value: stats?.totalOrders || 0,
            icon: ShoppingCart,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            label: 'Total Revenue',
            value: formatPrice(stats?.totalRevenue || 0),
            icon: DollarSign,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
        },
        {
            label: 'Products',
            value: stats?.totalProducts || 0,
            icon: Package,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            label: 'Users',
            value: stats?.totalUsers || '-',
            icon: Users,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="font-display text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="card p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">{stat.label}</p>
                                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-white text-lg">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {stats?.recentOrders.length ? (
                            stats.recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50">
                                    <div>
                                        <p className="font-medium text-white">#{order.order_number || order.id.slice(0, 8)}</p>
                                        <p className="text-sm text-slate-400">{formatDateTime(order.created_at)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-white">{formatPrice(order.total)}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBgColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 text-center py-8">No orders yet</p>
                        )}
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-white text-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Low Stock Alert
                        </h2>
                        <Link href="/admin/products" className="text-sm text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {stats?.lowStockProducts.length ? (
                            stats.lowStockProducts.map((product) => (
                                <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50">
                                    <div className="flex items-center gap-3">
                                        {product.images?.[0] && (
                                            <img
                                                src={product.images[0].url}
                                                alt=""
                                                className="w-10 h-10 rounded-lg object-cover"
                                            />
                                        )}
                                        <p className="font-medium text-white">{product.name}</p>
                                    </div>
                                    <span className="text-amber-500 font-medium">
                                        {product.stock} left
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 text-center py-8">All products are well stocked!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
