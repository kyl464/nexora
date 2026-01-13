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
    Loader2,
    BarChart3,
    Award,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { api, Order } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';

interface AnalyticsData {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    revenueChange: number;
    ordersChange: number;
    salesData: { date: string; revenue: number; orders: number }[];
    topProducts: { name: string; sold: number; revenue: number; image?: string }[];
}

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [chartView, setChartView] = useState<'revenue' | 'orders'>('revenue');

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
                const paidOrders = orders.orders?.filter(o =>
                    ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)
                ) || [];
                const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

                // Calculate change percentages (mock for now - would need historical data)
                const revenueChange = paidOrders.length > 0 ? 12.5 : 0;
                const ordersChange = orders.total > 0 ? 8.2 : 0;

                // Generate sales data from orders (last 7 days)
                const salesByDate: Record<string, { revenue: number; orders: number }> = {};
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    return date.toISOString().split('T')[0];
                });

                last7Days.forEach(date => {
                    salesByDate[date] = { revenue: 0, orders: 0 };
                });

                paidOrders.forEach(order => {
                    const orderDate = order.created_at.split('T')[0];
                    if (salesByDate[orderDate]) {
                        salesByDate[orderDate].revenue += order.total;
                        salesByDate[orderDate].orders += 1;
                    }
                });

                const salesData = Object.entries(salesByDate).map(([date, salesInfo]) => ({
                    date: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                    revenue: salesInfo.revenue,
                    orders: salesInfo.orders,
                }));

                // Calculate top products from order items
                const productSales: Record<string, { name: string; sold: number; revenue: number; image?: string }> = {};
                paidOrders.forEach(order => {
                    order.items?.forEach(item => {
                        const productId = item.product_id;
                        if (!productSales[productId]) {
                            productSales[productId] = {
                                name: item.product_name,
                                sold: 0,
                                revenue: 0,
                                image: item.product?.images?.[0]?.url,
                            };
                        }
                        productSales[productId].sold += item.quantity;
                        productSales[productId].revenue += item.subtotal;
                    });
                });

                const topProducts = Object.values(productSales)
                    .sort((a, b) => b.sold - a.sold)
                    .slice(0, 5);

                setData({
                    totalRevenue,
                    totalOrders: orders.total || 0,
                    totalProducts: products.total || 0,
                    totalUsers: users?.length || 0,
                    revenueChange,
                    ordersChange,
                    salesData,
                    topProducts,
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

            {/* Sales Chart */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-white text-lg">Sales Overview (Last 7 Days)</h2>
                    </div>
                    <div className="flex bg-dark-700 rounded-lg p-1">
                        <button
                            onClick={() => setChartView('revenue')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${chartView === 'revenue'
                                ? 'bg-primary text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Revenue
                        </button>
                        <button
                            onClick={() => setChartView('orders')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${chartView === 'orders'
                                ? 'bg-primary text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Orders
                        </button>
                    </div>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartView === 'revenue' ? (
                            <AreaChart data={data?.salesData || []}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                    }}
                                    labelStyle={{ color: '#f1f5f9' }}
                                    formatter={(value) => value !== undefined ? [formatPrice(value as number), 'Revenue'] : ['', 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        ) : (
                            <BarChart data={data?.salesData || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                    }}
                                    labelStyle={{ color: '#f1f5f9' }}
                                    formatter={(value) => value !== undefined ? [value, 'Orders'] : [0, 'Orders']}
                                />
                                <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Products */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-white text-lg">Top Selling Products</h3>
                </div>
                <div className="space-y-4">
                    {data?.topProducts && data.topProducts.length > 0 ? (
                        data.topProducts.map((product, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                                        {index + 1}
                                    </span>
                                    {product.image && (
                                        <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                    )}
                                    <div>
                                        <p className="font-medium text-white">{product.name}</p>
                                        <p className="text-sm text-slate-400">{product.sold} units sold</p>
                                    </div>
                                </div>
                                <span className="text-emerald-500 font-medium">
                                    {formatPrice(product.revenue)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-400 text-center py-8">No sales data yet. Top products will appear after orders are made.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
