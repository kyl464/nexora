'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Users,
    Loader2,
    Shield,
    ShieldCheck,
    MoreVertical,
    ChevronDown
} from 'lucide-react';
import { api, User } from '@/lib/api';
import { formatDateTime, cn } from '@/lib/utils';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await api.adminGetAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await api.adminUpdateUserRole(userId, newRole);
            fetchUsers();
            setActiveMenu(null);
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('Failed to update user role');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-display text-3xl font-bold text-white">Users</h1>
                <p className="text-slate-400 mt-1">Manage user accounts and roles</p>
            </div>

            {/* Search */}
            <div className="card p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-12 w-full"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400">No users found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-700/50 border-b border-dark-700">
                                <tr>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">User</th>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Email</th>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Role</th>
                                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Joined</th>
                                    <th className="text-right text-sm font-medium text-slate-400 px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-dark-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-medium">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="font-medium text-white">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                                                user.role === 'admin'
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-slate-500/10 text-slate-400'
                                            )}>
                                                {user.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {formatDateTime(user.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative flex justify-end">
                                                <button
                                                    onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                                                    className="p-2 rounded-lg hover:bg-dark-600 text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                {activeMenu === user.id && (
                                                    <div className="absolute right-0 top-10 z-10 bg-dark-700 border border-dark-600 rounded-xl shadow-xl py-2 min-w-[160px]">
                                                        <button
                                                            onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'customer' : 'admin')}
                                                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-dark-600"
                                                        >
                                                            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
