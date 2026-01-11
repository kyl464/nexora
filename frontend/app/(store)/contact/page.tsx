'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsSubmitted(true);
        setIsSubmitting(false);
    };

    const contactInfo = [
        {
            icon: Mail,
            label: 'Email',
            value: 'support@nexora.id',
            href: 'mailto:support@nexora.id',
        },
        {
            icon: Phone,
            label: 'Phone',
            value: '+62 21 1234 5678',
            href: 'tel:+622112345678',
        },
        {
            icon: MapPin,
            label: 'Address',
            value: 'Jakarta, Indonesia',
            href: null,
        },
    ];

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                        <Send className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">Message Sent!</h1>
                    <p className="text-slate-400 mb-6">
                        Thank you for contacting us. We&apos;ll get back to you as soon as possible.
                    </p>
                    <Button onClick={() => setIsSubmitted(false)} variant="outline">
                        Send Another Message
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                        Contact Us
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Have a question or need help? We&apos;re here for you.
                        Reach out and we&apos;ll respond as soon as possible.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h2 className="font-semibold text-white text-xl mb-6">Get in Touch</h2>
                        {contactInfo.map((item) => (
                            <div key={item.label} className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <item.icon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">{item.label}</p>
                                    {item.href ? (
                                        <a href={item.href} className="text-white hover:text-primary transition-colors">
                                            {item.value}
                                        </a>
                                    ) : (
                                        <p className="text-white">{item.value}</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="pt-6 border-t border-dark-700">
                            <h3 className="font-semibold text-white mb-4">Business Hours</h3>
                            <div className="space-y-2 text-slate-400">
                                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                                <p>Saturday: 10:00 AM - 4:00 PM</p>
                                <p>Sunday: Closed</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="card p-8">
                            <h2 className="font-semibold text-white text-xl mb-6">Send us a Message</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Your Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input w-full"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="input w-full"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="input w-full"
                                        placeholder="How can we help?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Message</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="input w-full resize-none"
                                        placeholder="Tell us more about your inquiry..."
                                    />
                                </div>
                                <Button type="submit" isLoading={isSubmitting} size="lg">
                                    <Send className="w-5 h-5" />
                                    Send Message
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
