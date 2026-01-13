'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit, Loader2, Check } from 'lucide-react';
import { api, Address } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { cn } from '@/lib/utils';

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        label: '',
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        postal_code: '',
        is_default: false,
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const data = await api.getAddresses();
            setAddresses(data);
        } catch (error) {
            console.error('Failed to fetch addresses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            label: '',
            name: '',
            phone: '',
            street: '',
            city: '',
            state: '',
            postal_code: '',
            is_default: false,
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (address: Address) => {
        setFormData({
            label: address.label,
            name: address.name,
            phone: address.phone,
            street: address.street,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            is_default: address.is_default,
        });
        setEditingId(address.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (editingId) {
                await api.updateAddress(editingId, formData);
            } else {
                await api.createAddress(formData);
            }
            await fetchAddresses();
            resetForm();
        } catch (error) {
            console.error('Failed to save address:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await api.deleteAddress(deleteId);
            await fetchAddresses();
            setDeleteId(null);
        } catch (error) {
            console.error('Failed to delete address:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="card p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-white">My Addresses</h2>
                {!showForm && (
                    <Button size="sm" onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4" />
                        Add Address
                    </Button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="card p-6 mb-6">
                    <h3 className="font-semibold text-white mb-4">
                        {editingId ? 'Edit Address' : 'New Address'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Label (e.g., Home, Office)"
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            className="input"
                        />
                        <input
                            type="text"
                            placeholder="Recipient Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input"
                        />
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="input"
                        />
                        <input
                            type="text"
                            placeholder="City"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="input"
                        />
                        <input
                            type="text"
                            placeholder="Street Address"
                            value={formData.street}
                            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                            className="input sm:col-span-2"
                        />
                        <input
                            type="text"
                            placeholder="State/Province"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="input"
                        />
                        <input
                            type="text"
                            placeholder="Postal Code"
                            value={formData.postal_code}
                            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                            className="input"
                        />
                        <label className="flex items-center gap-2 sm:col-span-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_default}
                                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                className="w-4 h-4 rounded border-dark-600 text-primary focus:ring-primary"
                            />
                            <span className="text-slate-300">Set as default address</span>
                        </label>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button onClick={handleSave} isLoading={isSaving}>
                            {editingId ? 'Update' : 'Save'} Address
                        </Button>
                        <Button variant="ghost" onClick={resetForm}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Address List */}
            {addresses.length === 0 ? (
                <div className="card p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No addresses saved</h3>
                    <p className="text-slate-400 mb-6">Add an address for faster checkout</p>
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4" />
                        Add Address
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className="card p-4 flex flex-col sm:flex-row gap-4"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span className="font-medium text-white">{address.label}</span>
                                    {address.is_default && (
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1">
                                            <Check className="w-3 h-3" />
                                            Default
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-300">{address.name}</p>
                                <p className="text-slate-400 text-sm">{address.phone}</p>
                                <p className="text-slate-400 text-sm mt-2">
                                    {address.street}<br />
                                    {address.city}, {address.state} {address.postal_code}
                                </p>
                            </div>
                            <div className="flex sm:flex-col gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(address)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(address.id)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Address"
                description="Are you sure you want to delete this address?"
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
}
