'use client';

import {
    Package,
    Laptop,
    Smartphone,
    Headphones,
    Watch,
    Camera,
    Shirt,
    Footprints,
    Sofa,
    Gamepad2,
    BookOpen,
    Utensils,
    Heart,
    Baby,
    Car,
    Bike,
    Dumbbell,
    Music,
    Tv,
    Monitor,
    Printer,
    Keyboard,
    Mouse,
    Gem,
    Gift,
    ShoppingBag,
    Home,
    Flower2,
    PawPrint,
    Scissors,
    Paintbrush,
    Wrench,
    Lightbulb,
    type LucideIcon,
} from 'lucide-react';

// Map of icon names to Lucide icon components
const iconMap: Record<string, LucideIcon> = {
    // Electronics
    laptop: Laptop,
    smartphone: Smartphone,
    phone: Smartphone,
    headphones: Headphones,
    watch: Watch,
    camera: Camera,
    tv: Tv,
    monitor: Monitor,
    printer: Printer,
    keyboard: Keyboard,
    mouse: Mouse,
    gamepad: Gamepad2,
    gamepad2: Gamepad2,
    music: Music,

    // Fashion
    shirt: Shirt,
    footprints: Footprints,
    shoes: Footprints,
    gem: Gem,
    jewelry: Gem,

    // Home & Living
    sofa: Sofa,
    furniture: Sofa,
    home: Home,
    flower: Flower2,
    flower2: Flower2,
    lightbulb: Lightbulb,

    // Books & Hobbies
    book: BookOpen,
    bookopen: BookOpen,
    paintbrush: Paintbrush,
    art: Paintbrush,

    // Health & Beauty
    heart: Heart,
    beauty: Heart,
    scissors: Scissors,

    // Food
    utensils: Utensils,
    food: Utensils,

    // Baby & Kids
    baby: Baby,
    kids: Baby,

    // Automotive & Sports
    car: Car,
    bike: Bike,
    dumbbell: Dumbbell,
    sports: Dumbbell,

    // Pets
    pawprint: PawPrint,
    pet: PawPrint,

    // Tools
    wrench: Wrench,
    tools: Wrench,

    // Others
    gift: Gift,
    shoppingbag: ShoppingBag,
    package: Package,
};

interface IconMapperProps {
    name: string;
    className?: string;
    size?: number;
}

export function IconMapper({ name, className = '', size = 24 }: IconMapperProps) {
    // Normalize the name (lowercase, remove spaces)
    const normalizedName = name?.toLowerCase().replace(/\s+/g, '') || '';

    // Find the matching icon or use Package as fallback
    const Icon = iconMap[normalizedName] || Package;

    return <Icon className={className} size={size} />;
}

// Export the icon map for reference
export { iconMap };
