import { Menu, ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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
};

export const Header = ({
    isScrolled,
    navLinks,
    onMobileMenuOpen,
    backLink,
    backLabel
}: HeaderProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const getLinkPath = (item: string) => {
        return item === 'about' ? '/' : `/${item}`;
    };

    const isActive = (item: string) => {
        const path = getLinkPath(item);
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
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
                        to="/"
                        className="text-lg md:text-xl font-black tracking-tighter text-black hover:text-black/80 transition-premium"
                    >
                        Ryota Onuma
                    </Link>

                    {backLink && (
                        <button
                            onClick={() => navigate(backLink)}
                            className="flex items-center gap-2 text-black/40 hover:text-black transition-premium group"
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
                            to={getLinkPath(item)}
                            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-premium ${isActive(item)
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
