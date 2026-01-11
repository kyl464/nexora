'use client';

import { Settings, Store, Bell, Shield, Palette } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-display text-3xl font-bold text-white">Settings</h1>
                <p className="text-slate-400 mt-1">Configure your store settings</p>
            </div>

            {/* Settings Sections */}
            <div className="grid gap-6">
                {/* Store Info */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">Store Information</h2>
                            <p className="text-sm text-slate-400">Basic store details</p>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Store Name</label>
                            <input type="text" defaultValue="Nexora" className="input w-full" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Contact Email</label>
                            <input type="email" defaultValue="support@nexora.com" className="input w-full" />
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">Notifications</h2>
                            <p className="text-sm text-slate-400">Email and alert preferences</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl cursor-pointer">
                            <span className="text-slate-300">Email on new orders</span>
                            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl cursor-pointer">
                            <span className="text-slate-300">Low stock alerts</span>
                            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
                        </label>
                    </div>
                </div>

                {/* Security */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">Security</h2>
                            <p className="text-sm text-slate-400">Password and authentication</p>
                        </div>
                    </div>
                    <Button variant="outline">Change Password</Button>
                </div>
            </div>
        </div>
    );
}
