import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    fullWidth?: boolean;
    isLoading?: boolean;
    href?: string;
    children: React.ReactNode;
}

const variants = {
    primary: 'bg-gradient-primary text-white shadow-md hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-gradient-secondary text-white shadow-md hover:shadow-glow-orange hover:-translate-y-0.5',
    outline: 'bg-transparent text-slate-50 border border-dark-700 hover:bg-dark-700 hover:border-dark-600',
    ghost: 'bg-transparent text-slate-400 hover:bg-dark-700 hover:text-slate-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
};

const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
    icon: 'p-2.5 w-10 h-10',
};

export function Button({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading = false,
    href,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const classes = cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        isLoading && 'relative text-transparent pointer-events-none',
        className
    );

    if (href) {
        return (
            <Link href={href} className={classes}>
                {children}
            </Link>
        );
    }

    return (
        <button className={classes} disabled={disabled || isLoading} {...props}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            {children}
        </button>
    );
}
