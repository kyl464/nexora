import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Learn how Nexora collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="font-display text-4xl font-bold text-white mb-8">Privacy Policy</h1>

                <div className="prose prose-invert prose-slate max-w-none">
                    <p className="text-slate-400 mb-8">Last updated: January 2026</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
                        <p className="text-slate-300">
                            At Nexora, we take your privacy seriously. This Privacy Policy explains how we collect,
                            use, disclose, and safeguard your information when you visit our website or make a purchase.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
                        <p className="text-slate-300 mb-4">We collect information that you provide directly to us, including:</p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Name and contact information (email, phone number)</li>
                            <li>Shipping and billing addresses</li>
                            <li>Payment information (processed securely by our payment providers)</li>
                            <li>Order history and preferences</li>
                            <li>Communications with our customer service team</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
                        <p className="text-slate-300 mb-4">We use the information we collect to:</p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Process and fulfill your orders</li>
                            <li>Communicate with you about your orders and account</li>
                            <li>Improve our website and services</li>
                            <li>Send promotional communications (with your consent)</li>
                            <li>Prevent fraud and ensure security</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
                        <p className="text-slate-300">
                            We implement appropriate technical and organizational measures to protect your personal
                            information against unauthorized access, alteration, disclosure, or destruction.
                            Payment processing is handled by trusted third-party providers who comply with
                            industry security standards.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
                        <p className="text-slate-300 mb-4">You have the right to:</p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Access your personal information</li>
                            <li>Correct inaccurate information</li>
                            <li>Request deletion of your data</li>
                            <li>Opt-out of marketing communications</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
                        <p className="text-slate-300">
                            If you have any questions about this Privacy Policy, please contact us at{' '}
                            <a href="mailto:privacy@nexora.id" className="text-primary hover:underline">
                                privacy@nexora.id
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
