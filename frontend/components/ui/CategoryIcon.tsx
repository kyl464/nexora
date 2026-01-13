'use client';

import { IconMapper } from '@/components/ui/IconMapper';

interface CategoryIconProps {
    name: string;
}

export function CategoryIcon({ name }: CategoryIconProps) {
    return <IconMapper name={name || 'package'} size={24} />;
}
