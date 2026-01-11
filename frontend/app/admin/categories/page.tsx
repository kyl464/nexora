'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Loader2,
    Grid3X3,
    Search
} from 'lucide-react';
import { api, Category } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', icon: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setIsSaving(true);
        try {
            if (editingId) {
                await api.adminUpdateCategory(editingId, formData);
            } else {
                await api.adminCreateCategory(formData.name, formData.icon);
            }
            await fetchCategories();
            resetForm();
        } catch (error) {
            console.error('Failed to save category:', error);
            alert('Failed to save category');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.id);
        setFormData({ name: category.name, icon: category.icon || '' });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await api.adminDeleteCategory(id);
            await fetchCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
            alert('Failed to delete category');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', icon: '' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold text-white">Categories</h1>
                    <p className="text-slate-400 mt-1">Manage product categories</p>
                </div>
                <Button onClick={() => { resetForm(); setShowForm(true); }}>
                    <Plus className="w-4 h-4" />
                    Add Category
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="card p-6">
                    <h2 className="font-semibold text-white mb-4">
                        {editingId ? 'Edit Category' : 'New Category'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Category Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Electronics"
                                    className="input w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Icon Name (Lucide)</label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    placeholder="e.g., Laptop, Smartphone, Shirt"
                                    className="input w-full"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Use Lucide icon names from lucide.dev/icons
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button type="submit" isLoading={isSaving}>
                                {editingId ? 'Update Category' : 'Create Category'}
                            </Button>
                            <Button type="button" variant="ghost" onClick={resetForm}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Categories Grid */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-8 text-center">
                        <Grid3X3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400">No categories yet</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="p-4 rounded-xl bg-dark-700/50 border border-dark-600 hover:border-dark-500 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <Grid3X3 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{category.name}</p>
                                            <p className="text-xs text-slate-500">{category.slug}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="p-2 rounded-lg hover:bg-dark-600 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
