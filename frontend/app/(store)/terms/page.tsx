import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'Terms and conditions for using Nexora e-commerce platform.',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="font-display text-4xl font-bold text-white mb-8">Terms of Service</h1>

                <div className="prose prose-invert prose-slate max-w-none">
                    <p className="text-slate-400 mb-8">Last updated: January 2026</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="text-slate-300">
                            By accessing and using Nexora, you accept and agree to be bound by the terms and
                            provisions of this agreement. If you do not agree to these terms, please do not
                            use our services.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Use of Service</h2>
                        <p className="text-slate-300 mb-4">You agree to use our service only for lawful purposes. You are prohibited from:</p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2">
                            <li>Using the service for any illegal activities</li>
                            <li>Attempting to gain unauthorized access to our systems</li>
                            <li>Interfering with other users&apos; use of the service</li>
                            <li>Submitting false or misleading information</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
                        <p className="text-slate-300">
                            To access certain features, you may need to create an account. You are responsible
                            for maintaining the confidentiality of your account credentials and for all activities
                            that occur under your account.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Products and Pricing</h2>
                        <p className="text-slate-300">
                            We strive to provide accurate product information and pricing. However, errors may
                            occur. We reserve the right to correct any errors and to change or update information
                            at any time without prior notice.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Orders and Payment</h2>
                        <p className="text-slate-300">
                            All orders are subject to availability and confirmation. Payment must be received
                            before order processing. We accept various payment methods as displayed at checkout.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Shipping and Delivery</h2>
                        <p className="text-slate-300">
                            Delivery times are estimates only. We are not responsible for delays caused by
                            carriers or circumstances beyond our control. Risk of loss passes to you upon
                            delivery.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Returns and Refunds</h2>
                        <p className="text-slate-300">
                            Please refer to our Returns Policy for information on returning products and
                            obtaining refunds. Returns must be initiated within 14 days of delivery.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
                        <p className="text-slate-300">
                            Nexora shall not be liable for any indirect, incidental, special, or consequential
                            damages arising from your use of our service or products.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to Terms</h2>
                        <p className="text-slate-300">
                            We reserve the right to modify these terms at any time. Changes will be effective
                            immediately upon posting to the website. Continued use of the service after changes
                            constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">10. Contact</h2>
                        <p className="text-slate-300">
                            For questions about these Terms of Service, please contact us at{' '}
                            <a href="mailto:legal@nexora.id" className="text-primary hover:underline">
                                legal@nexora.id
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
