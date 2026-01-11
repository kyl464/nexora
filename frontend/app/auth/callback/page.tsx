'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/context';

export default function AuthCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { refreshUser } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            localStorage.setItem('token', token);
            refreshUser().then(() => {
                router.push('/');
            });
        } else {
            router.push('/auth/error?message=no_token');
        }
    }, [searchParams, router, refreshUser]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Signing you in...</h2>
                <p className="text-slate-400">Please wait a moment</p>
            </div>
        </div>
    );
}
