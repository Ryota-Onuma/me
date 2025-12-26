import { X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    navLinks: string[];
}

const navLabels: Record<string, string> = {
    home: 'Home',
    blog: 'Blog',
    about: 'About',
};

/**
 * MobileMenu - モバイルメニューオーバーレイ
 */
export const MobileMenu = ({ isOpen, onClose, navLinks }: MobileMenuProps): JSX.Element | null => {
    const location = useLocation();
    const isHome = location.pathname === '/';


    const handleLinkClick = (): void => {
        // Native behavior will update the hash, and useHashScroll will handle the scroll immediately.
        onClose();
    };

    const getLinkPath = (item: string): string => {
        if (item === 'blog') return '/blog';
        return isHome ? `#${item}` : `/#${item}`;
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[2000] bg-[#050505]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-10 animate-fade-in"
        >
            <button
                className="absolute top-8 right-6 md:top-12 md:right-12 text-white/50 hover:text-white transition-colors"
                onClick={onClose}
                aria-label="Close menu"
            >
                <X className="w-8 h-8 md:w-10 md:h-10" />
            </button>
            <div className="flex flex-col items-center gap-8">
                {navLinks.map((item) => (
                    <Link
                        key={item}
                        to={getLinkPath(item)}
                        onClick={handleLinkClick}
                        className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white/70 hover:text-accent active:text-accent transition-premium"
                    >
                        {navLabels[item] || item}
                    </Link>
                ))}
            </div>
        </div>
    );
};
