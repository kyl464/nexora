import Link from 'next/link';
import { Users, Award, Truck, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = {
    title: 'About Us',
    description: 'Learn about Nexora - your premier destination for premium products with exceptional quality and service.',
};

export default function AboutPage() {
    const stats = [
        { label: 'Happy Customers', value: '50K+' },
        { label: 'Products Sold', value: '100K+' },
        { label: 'Categories', value: '20+' },
        { label: 'Years of Service', value: '5+' },
    ];

    const values = [
        {
            icon: Award,
            title: 'Quality First',
            description: 'We source only the highest quality products from trusted manufacturers and suppliers.',
        },
        {
            icon: Users,
            title: 'Customer Focus',
            description: 'Your satisfaction is our priority. We provide exceptional customer service at every step.',
        },
        {
            icon: Truck,
            title: 'Fast Delivery',
            description: 'Quick and reliable shipping to get your products to you as fast as possible.',
        },
        {
            icon: Shield,
            title: 'Secure Shopping',
            description: 'Shop with confidence knowing your personal information is protected.',
        },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="py-20 px-4 text-center bg-gradient-to-br from-primary/10 via-dark-900 to-accent/10">
                <div className="max-w-4xl mx-auto">
                    <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-6">
                        About <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Nexora</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        We&apos;re on a mission to make premium products accessible to everyone.
                        Discover what&apos;s next in online shopping.
                    </p>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <p className="font-display text-4xl font-bold text-primary mb-2">{stat.value}</p>
                            <p className="text-slate-400">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Our Story */}
            <section className="py-16 px-4 bg-dark-800/50">
                <div className="max-w-4xl mx-auto">
                    <h2 className="font-display text-3xl font-bold text-white text-center mb-8">Our Story</h2>
                    <div className="space-y-4 text-slate-300 text-lg">
                        <p>
                            Nexora was founded with a simple belief: everyone deserves access to quality products
                            at fair prices. Starting as a small online store, we&apos;ve grown into a trusted
                            marketplace serving customers across Indonesia.
                        </p>
                        <p>
                            Our team carefully curates each product in our catalog, ensuring that only the best
                            items make it to our virtual shelves. We partner with reputable brands and manufacturers
                            who share our commitment to quality and customer satisfaction.
                        </p>
                        <p>
                            Today, Nexora continues to evolve, embracing new technologies and expanding our
                            product range to meet the diverse needs of our customers. We&apos;re not just a store;
                            we&apos;re your partner in discovering what&apos;s next.
                        </p>
                    </div>
                </div>
            </section>

            {/* Our Values */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="font-display text-3xl font-bold text-white text-center mb-12">Our Values</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value) => (
                            <div key={value.title} className="card p-6 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <value.icon className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="font-semibold text-white mb-2">{value.title}</h3>
                                <p className="text-slate-400 text-sm">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-display text-3xl font-bold text-white mb-4">Ready to Start Shopping?</h2>
                    <p className="text-slate-400 mb-8">Explore our collection and find your next favorite product.</p>
                    <Link href="/products">
                        <Button size="lg">
                            Browse Products
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
