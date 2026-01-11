'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { api, Category } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function NewProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        base_price: '',
        stock: '',
        category_id: '',
        sku: '',
        is_active: true,
        is_featured: false,
    });

    const [imageUrls, setImageUrls] = useState<string[]>(['']);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await api.getCategories();
                setCategories(data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSlugGenerate = () => {
        const slug = formData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        setFormData(prev => ({ ...prev, slug }));
    };

    const handleImageChange = (index: number, value: string) => {
        const newUrls = [...imageUrls];
        newUrls[index] = value;
        setImageUrls(newUrls);
    };

    const addImageField = () => {
        setImageUrls([...imageUrls, '']);
    };

    const removeImageField = (index: number) => {
        setImageUrls(imageUrls.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const productData = {
                name: formData.name,
                description: formData.description,
                base_price: parseFloat(formData.base_price) || 0,
                stock: parseInt(formData.stock) || 0,
                category_id: formData.category_id || undefined,
                is_active: formData.is_active,
                is_featured: formData.is_featured,
                images: imageUrls.filter(url => url.trim()),
            };

            await api.adminCreateProduct(productData);
            router.push('/admin/products');
        } catch (error) {
            console.error('Failed to create product:', error);
            alert('Failed to create product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/products" className="p-2 rounded-lg hover:bg-dark-700 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="font-display text-3xl font-bold text-white">Add New Product</h1>
                    <p className="text-slate-400 mt-1">Create a new product listing</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-6 space-y-4">
                        <h2 className="font-semibold text-white">Basic Information</h2>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Product Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={handleSlugGenerate}
                                required
                                className="input w-full"
                                placeholder="Enter product name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Slug</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    className="input flex-1"
                                    placeholder="product-slug"
                                />
                                <Button type="button" variant="outline" onClick={handleSlugGenerate}>
                                    Generate
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={5}
                                className="input w-full resize-none"
                                placeholder="Product description..."
                            />
                        </div>
                    </div>

                    {/* Images */}
                    <div className="card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-white">Images</h2>
                            <Button type="button" variant="ghost" size="sm" onClick={addImageField}>
                                <Plus className="w-4 h-4" /> Add Image
                            </Button>
                        </div>

                        {imageUrls.map((url, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => handleImageChange(index, e.target.value)}
                                    className="input flex-1"
                                    placeholder="https://example.com/image.jpg"
                                />
                                {imageUrls.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeImageField(index)}
                                        className="p-3 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <p className="text-xs text-slate-500">First image will be the primary image</p>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Pricing & Stock */}
                    <div className="card p-6 space-y-4">
                        <h2 className="font-semibold text-white">Pricing & Inventory</h2>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Price (IDR) *</label>
                            <input
                                type="number"
                                name="base_price"
                                value={formData.base_price}
                                onChange={handleChange}
                                required
                                min="0"
                                className="input w-full"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Stock *</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                required
                                min="0"
                                className="input w-full"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">SKU</label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                className="input w-full"
                                placeholder="ABC-123"
                            />
                        </div>
                    </div>

                    {/* Organization */}
                    <div className="card p-6 space-y-4">
                        <h2 className="font-semibold text-white">Organization</h2>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Category</label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className="input w-full"
                            >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <label className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-xl cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-5 h-5 accent-primary"
                            />
                            <span className="text-slate-300">Active (visible in store)</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-xl cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_featured"
                                checked={formData.is_featured}
                                onChange={handleChange}
                                className="w-5 h-5 accent-primary"
                            />
                            <span className="text-slate-300">Featured product</span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button type="submit" isLoading={isLoading} fullWidth>
                            Create Product
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
