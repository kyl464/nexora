import type { Metadata } from 'next';
import Script from 'next/script';
import { Providers } from '@/lib/context';
import '@/styles/globals.css';

export const metadata: Metadata = {
    title: {
        default: 'Nexora - Discover What\'s Next',
        template: '%s | Nexora',
    },
    description: 'Premium e-commerce platform with curated products. Shop the future of online shopping.',
    keywords: ['e-commerce', 'shop', 'online store', 'premium products'],
    openGraph: {
        type: 'website',
        locale: 'id_ID',
        siteName: 'Nexora',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id">
            <head>
                <Script
                    src="https://app.sandbox.midtrans.com/snap/snap.js"
                    data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
                    strategy="beforeInteractive"
                />
            </head>
            <body className="min-h-screen flex flex-col">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
