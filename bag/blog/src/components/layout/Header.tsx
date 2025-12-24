import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
    isScrolled: boolean;
    activeSection: string;
    navLinks: string[];
    onMobileMenuOpen: () => void;
}

/**
 * Header - ナビゲーションヘッダー
 */
export const Header = ({
    isScrolled,
    activeSection,
    navLinks,
    onMobileMenuOpen
}: HeaderProps) => {
    const location = useLocation();
    const isHome = location.pathname === '/';

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, item: string) => {
        if (isHome) {
            e.preventDefault();
            const element = document.getElementById(item);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <header
            className={`fixed top-0 left-0 w-full z-[1000] flex justify-between items-center transition-all duration-700 ease-[0.16,1,0.3,1] ${isScrolled
                ? 'h-16 md:h-20 px-6 md:px-16 bg-[#050505]/90 backdrop-blur-xl border-b border-white/20'
                : 'h-20 md:h-28 px-6 md:px-20 bg-transparent'
                }`}
        >
            <Link
                to="/"
                className="flex items-center gap-4 cursor-pointer group"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                <div className="relative">
                    <span className="text-lg font-black tracking-[-0.05em] uppercase italic transition-colors duration-500 group-hover:text-white">
                        Ryota Onuma
                    </span>
                    <motion.div
                        className="absolute -bottom-1 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-500 ease-out"
                    />
                </div>
            </Link>

            <nav className="hidden lg:flex gap-12 md:gap-16">
                {navLinks.map((item) => (
                    <Link
                        key={item}
                        to={isHome ? `#${item}` : `/#${item}`}
                        onClick={(e: any) => handleLinkClick(e, item)}
                        className={`text-[9px] tracking-[0.5em] font-black uppercase transition-all duration-500 relative ${activeSection === item ? 'text-white' : 'text-white/50 hover:text-white'
                            }`}
                    >
                        {item}
                        {activeSection === item && (
                            <motion.div
                                layoutId="navIndicator"
                                className="absolute -bottom-2 left-0 w-full h-px bg-white"
                            />
                        )}
                    </Link>
                ))}
            </nav>

            <button
                className="lg:hidden text-white p-2 -mr-2"
                onClick={onMobileMenuOpen}
                aria-label="Open menu"
            >
                <Menu className="w-6 h-6" />
            </button>
        </header>
    );
};
