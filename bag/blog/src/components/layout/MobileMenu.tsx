import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    navLinks: string[];
}

/**
 * MobileMenu - モバイルメニューオーバーレイ
 */
export const MobileMenu = ({ isOpen, onClose, navLinks }: MobileMenuProps) => {
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
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: '-100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '-100%' }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed inset-0 z-[2000] bg-[#050505]/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-10"
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
                                to={isHome ? `#${item}` : `/#${item}`}
                                onClick={(e: any) => handleLinkClick(e, item)}
                                className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white/20 hover:text-white transition-all duration-500 hover:scale-110"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
