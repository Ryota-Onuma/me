'use client';

import React from 'react';

import { X } from 'lucide-react';
import Link from 'next/link';
import { NAV_LINKS } from '@/lib/navigation';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const navLabels: Record<string, string> = {
    about: 'About',
    blog: 'Blog',
    scrap: 'Scrap',
    library: 'Library',
};

/**
 * MobileMenu - モバイルメニューオーバーレイ
 */
export const MobileMenu = ({ isOpen, onClose }: MobileMenuProps): React.ReactNode => {
    const handleLinkClick = (): void => {
        onClose();
    };

    const getLinkPath = (item: string): string => {
        return item === 'about' ? '/' : `/${item}`;
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[2000] bg-[#fafafa]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-10 animate-fade-in"
        >
            <button
                className="absolute top-8 right-6 md:top-12 md:right-12 text-black/50 hover:text-black transition-colors"
                onClick={onClose}
                aria-label="Close menu"
            >
                <X className="w-8 h-8 md:w-10 md:h-10" />
            </button>
            <div className="flex flex-col items-center gap-8">
                {NAV_LINKS.map((item) => (
                    <Link
                        key={item}
                        href={getLinkPath(item)}
                        onClick={handleLinkClick}
                        className="text-4xl md:text-6xl font-black uppercase tracking-[0.2em] text-black/40 hover:text-black transition-premium"
                    >
                        {navLabels[item]}
                    </Link>
                ))}
            </div>
        </div>
    );
};
