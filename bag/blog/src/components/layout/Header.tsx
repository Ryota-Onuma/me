'use client';

import { useState } from 'react';
import { Menu, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useHasScrolled } from '@/hooks/useHasScrolled';
import { NAV_LINKS } from '@/lib/navigation';
import { MobileMenu } from './MobileMenu';

interface HeaderProps {
    backLink?: string;
    backLabel?: string;
}

const navLabels: Record<string, string> = {
    about: 'About',
    blog: 'Blog',
    scrap: 'Scrap',
    library: 'Library',
};

export const Header = ({
    backLink,
    backLabel
}: HeaderProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const { isScrolled } = useHasScrolled();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const getLinkPath = (item: string) => {
        return item === 'about' ? '/' : `/${item}`;
    };

    const isActive = (item: string) => {
        const path = getLinkPath(item);
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    return (
        <>
            <header
                className={`fixed top-0 left-0 w-full z-[1000] border-b border-black/10 bg-[#fbfbfa]/95 transition-all duration-200 ${isScrolled ? 'h-16' : 'h-20'
                    }`}
            >
                <div className="h-full flex justify-between items-center px-6 md:px-16 lg:px-24">
                    <div className="flex items-center gap-6 md:gap-8">
                        {/* Logo */}
                        <Link
                            href="/"
                            className="text-lg md:text-xl font-semibold text-black hover:text-black/70 transition-premium cursor-pointer"
                        >
                            ryota.onuma<span className="text-[#76b5c5]">.dev</span>
                        </Link>

                        {backLink && (
                            <button
                                onClick={() => router.push(backLink)}
                                className="flex items-center gap-2 text-black/50 hover:text-black transition-premium group"
                                aria-label={`Go back to ${backLabel || 'previous page'}`}
                            >
                                <div className="p-1.5 rounded-md bg-white border border-black/10 group-hover:border-black/20 transition-premium">
                                    <ArrowLeft size={12} />
                                </div>
                                <span className="text-xs font-medium">{backLabel || 'Back'}</span>
                            </button>
                        )}
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-2">
                        {NAV_LINKS.map((item) => (
                            <Link
                                key={item}
                                href={getLinkPath(item)}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-premium cursor-pointer ${isActive(item)
                                    ? 'text-black bg-black/[0.04]'
                                    : 'text-black/45 hover:text-black hover:bg-black/[0.04]'
                                    }`}
                            >
                                {navLabels[item]}
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 text-black/50 hover:text-black transition-premium"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
        </>
    );
};
