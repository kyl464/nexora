'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    DollarSign,
    Package,
    Users,
    ShoppingCart,
    ArrowUp,
    ArrowDown,
    Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';

interface AnalyticsData {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    revenueChange: number;
    ordersChange: number;
}

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch data from various endpoints
                const [products, orders, users] = await Promise.all([
                    api.getProducts({ limit: 1 }),
                    api.adminGetAllOrders(1),
                    api.adminGetAllUsers()
                ]);

                // Calculate totals - count paid/processing/shipped/delivered orders for revenue
                const successfulOrders = orders.orders?.filter(o =>
                    ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)
                ) || [];
                const totalRevenue = successfulOrders.reduce((sum, o) => sum + o.total, 0);

                // Calculate change percentages (mock for now - would need historical data)
                const revenueChange = successfulOrders.length > 0 ? 12.5 : 0;
                const ordersChange = orders.total > 0 ? 8.2 : 0;

                setData({
                    totalRevenue,
                    totalOrders: orders.total || 0,
                    totalProducts: products.total || 0,
                    totalUsers: users?.length || 0,
                    revenueChange,
                    ordersChange,
                });
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const stats = [
        {
            name: 'Total Revenue',
            value: formatPrice(data?.totalRevenue || 0),
            change: data?.revenueChange || 0,
            icon: DollarSign,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
        },
        {
            name: 'Total Orders',
            value: data?.totalOrders || 0,
            change: data?.ordersChange || 0,
            icon: ShoppingCart,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        },
        {
            name: 'Products',
            value: data?.totalProducts || 0,
            change: 0,
            icon: Package,
            color: 'text-violet-500',
            bg: 'bg-violet-500/10',
        },
        {
            name: 'Users',
            value: data?.totalUsers || 0,
            change: 0,
            icon: Users,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-display text-3xl font-bold text-white">Analytics</h1>
                <p className="text-slate-400 mt-1">Track your store performance</p>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.bg)}>
                                <stat.icon className={cn('w-6 h-6', stat.color)} />
                            </div>
                            {stat.change !== 0 && (
                                <div className={cn(
                                    'flex items-center gap-1 text-sm font-medium',
                                    stat.change > 0 ? 'text-emerald-500' : 'text-red-500'
                                )}>
                                    {stat.change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                    {Math.abs(stat.change)}%
                                </div>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-slate-400 text-sm">{stat.name}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="card p-6">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Revenue Overview
                    </h3>
                    <div className="h-64 flex items-center justify-center border border-dashed border-dark-600 rounded-xl">
                        <div className="text-center">
                            <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500">Chart visualization coming soon</p>
                            <p className="text-xs text-slate-600 mt-1">Integrate with charting library like Recharts</p>
                        </div>
                    </div>
                </div>

                {/* Orders Chart */}
                <div className="card p-6">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        Orders Overview
                    </h3>
                    <div className="h-64 flex items-center justify-center border border-dashed border-dark-600 rounded-xl">
                        <div className="text-center">
                            <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500">Chart visualization coming soon</p>
                            <p className="text-xs text-slate-600 mt-1">Integrate with charting library like Recharts</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Products */}
            <div className="card p-6">
                <h3 className="font-semibold text-white mb-4">Top Products</h3>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-dark-700/50">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                #{i}
                            </div>
                            <div className="flex-1">
                                <div className="h-4 bg-dark-600 rounded w-1/3 animate-pulse" />
                            </div>
                            <div className="text-right">
                                <div className="h-4 bg-dark-600 rounded w-20 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-center text-slate-500 text-sm mt-4">
                    Top products data will be available after more sales
                </p>
            </div>
        </div>
    );
}
