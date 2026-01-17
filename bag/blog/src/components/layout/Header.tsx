'use client';

import { Menu, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface HeaderProps {
    isScrolled: boolean;
    navLinks: string[];
    onMobileMenuOpen: () => void;
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
    isScrolled,
    navLinks,
    onMobileMenuOpen,
    backLink,
    backLabel
}: HeaderProps) => {
    const pathname = usePathname();
    const router = useRouter();

    const getLinkPath = (item: string) => {
        return item === 'about' ? '/' : `/${item}`;
    };

    const isActive = (item: string) => {
        const path = getLinkPath(item);
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    return (
        <header
            className={`fixed top-0 left-0 w-full z-[1000] border-b border-black/5 bg-[#fafafa]/80 backdrop-blur-xl transition-all duration-300 ${isScrolled ? 'h-16' : 'h-20 md:h-24'
                }`}
        >
            <div className="h-full flex justify-between items-center px-6 md:px-16 lg:px-24">
                <div className="flex items-center gap-6 md:gap-8">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="text-xl md:text-2xl font-black tracking-tighter text-black hover:text-black/80 transition-premium cursor-pointer"
                    >
                        ryota.onuma<span className="text-[#76b5c5]">.dev</span>
                    </Link>

                    {backLink && (
                        <button
                            onClick={() => router.push(backLink)}
                            className="flex items-center gap-2 text-black/40 hover:text-black transition-premium group"
                            aria-label={`Go back to ${backLabel || 'previous page'}`}
                        >
                            <div className="p-1.5 rounded-full bg-black/5 border border-black/10 group-hover:border-black/20 transition-premium">
                                <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                            </div>
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase">{backLabel || 'Back'}</span>
                        </button>
                    )}
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-2">
                    {navLinks.map((item) => (
                        <Link
                            key={item}
                            href={getLinkPath(item)}
                            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] transition-premium cursor-pointer ${isActive(item)
                                ? 'text-black'
                                : 'text-black/30 hover:text-black hover:bg-black/5'
                                }`}
                        >
                            {navLabels[item]}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="lg:hidden p-2 text-black/50 hover:text-black transition-premium"
                    onClick={onMobileMenuOpen}
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};
