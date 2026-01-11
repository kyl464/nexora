'use client';

import { useState } from 'react';
import { User, Mail, Camera } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/context';
import { Button } from '@/components/ui/Button';

export default function AccountProfilePage() {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            await api.updateProfile({ name });
            await refreshUser();
            setMessage('Profile updated successfully!');
        } catch (error) {
            setMessage('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="card p-6">
            <h2 className="font-display text-xl font-bold text-white mb-6">Profile Information</h2>

            <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
                {/* Avatar */}
                <div className="relative">
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-24 h-24 rounded-2xl object-cover"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center">
                            <User className="w-12 h-12 text-white" />
                        </div>
                    )}
                    <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <Camera className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1">
                    <p className="text-sm text-slate-400 mb-1">
                        Your profile photo is synced from your Google account
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Full Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input pl-12"
                            placeholder="Enter your name"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="input pl-12 opacity-60 cursor-not-allowed"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Email is managed by your Google account
                    </p>
                </div>

                {message && (
                    <p className={`text-sm ${message.includes('success') ? 'text-emerald-500' : 'text-red-500'}`}>
                        {message}
                    </p>
                )}

                <Button onClick={handleSave} isLoading={isSaving}>
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
