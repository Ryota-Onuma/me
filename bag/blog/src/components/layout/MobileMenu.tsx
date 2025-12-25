import { X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    navLinks: string[];
}

/**
 * MobileMenu - モバイルメニューオーバーレイ (CSS transitions)
 */
export const MobileMenu = ({ isOpen, onClose, navLinks }: MobileMenuProps) => {
    const location = useLocation();
    const isHome = location.pathname === '/';


    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, item: string) => {
        if (item === 'blog') {
            onClose();
            return;
        }
        if (isHome) {
            e.preventDefault();
            document.getElementById(item)?.scrollIntoView({ behavior: 'smooth' });
        }
        onClose();
    };

    const getLinkPath = (item: string) => {
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
                        onClick={(e: any) => handleLinkClick(e, item)}
                        className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white/20 hover:text-white transition-all duration-300"
                    >
                        {item}
                    </Link>
                ))}
            </div>
        </div>
    );
};
