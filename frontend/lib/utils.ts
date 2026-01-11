import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'text-yellow-500',
        paid: 'text-blue-500',
        processing: 'text-cyan-500',
        shipped: 'text-primary',
        delivered: 'text-emerald-500',
        cancelled: 'text-red-500',
        success: 'text-emerald-500',
        failed: 'text-red-500',
        expired: 'text-slate-500',
    };
    return colors[status] || 'text-slate-400';
}

export function getStatusBgColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-500/10 text-yellow-500',
        paid: 'bg-blue-500/10 text-blue-500',
        processing: 'bg-cyan-500/10 text-cyan-500',
        shipped: 'bg-primary/10 text-primary',
        delivered: 'bg-emerald-500/10 text-emerald-500',
        cancelled: 'bg-red-500/10 text-red-500',
        success: 'bg-emerald-500/10 text-emerald-500',
        failed: 'bg-red-500/10 text-red-500',
        expired: 'bg-slate-500/10 text-slate-500',
    };
    return colors[status] || 'bg-slate-500/10 text-slate-400';
}

export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        pending: 'Menunggu Pembayaran',
        paid: 'Dibayar',
        processing: 'Diproses',
        shipped: 'Dikirim',
        delivered: 'Selesai',
        cancelled: 'Dibatalkan',
        success: 'Berhasil',
        failed: 'Gagal',
        expired: 'Kadaluarsa',
    };
    return labels[status] || status;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}
