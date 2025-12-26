import { Menu, Home, User, BookOpen, ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { scrollToSection } from '../../utils/scroll';

interface HeaderProps {
    isScrolled: boolean;
    activeSection: string;
    navLinks: string[];
    onMobileMenuOpen: () => void;
    backLink?: string;
    backLabel?: string;
}

const navIcons: Record<string, React.ReactNode> = {
    home: <Home className="w-3.5 h-3.5" />,
    about: <User className="w-3.5 h-3.5" />,
    blog: <BookOpen className="w-3.5 h-3.5" />,
};

const navLabels: Record<string, string> = {
    home: 'Home',
    about: 'About',
    blog: 'Blog',
};

export const Header = ({
    isScrolled,
    activeSection,
    navLinks,
    onMobileMenuOpen,
    backLink,
    backLabel
}: HeaderProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isHome = location.pathname === '/';
    const isBlogPage = location.pathname === '/blog';

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, item: string) => {
        if (item === 'blog') {
            if (isBlogPage) {
                e.preventDefault();
                scrollToSection('home');
                return;
            }
        }
        // For other links, native behavior will update the hash, 
        // and useHashScroll will handle the scroll immediately.
    };

    const getLinkPath = (item: string) => {
        if (item === 'blog') return '/blog';
        return isHome ? `#${item}` : `/#${item}`;
    };

    const isActive = (item: string) => {
        if (item === 'blog' && isBlogPage) return true;
        return activeSection === item && !isBlogPage;
    };

    return (
        <header
            className={`fixed top-0 left-0 w-full z-[1000] transition-all duration-200 ${isScrolled
                ? 'h-16 bg-[#050505]/95 backdrop-blur-md border-b border-white/10'
                : 'h-20 md:h-24 bg-transparent'
                }`}
        >
            <div className="h-full flex justify-between items-center px-6 md:px-16">
                {backLink ? (
                    <button
                        onClick={() => navigate(backLink)}
                        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
                    >
                        <div className="p-1.5 rounded-full bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        <span className="text-sm font-bold tracking-wide uppercase">{backLabel || 'Back'}</span>
                    </button>
                ) : (
                    <>
                        {/* Logo */}
                        <Link
                            to="/"
                            className="text-sm md:text-base font-bold tracking-tight text-white/90 hover:text-white transition-colors duration-150"
                        >
                            Ryota Onuma
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navLinks.map((item) => (
                                <Link
                                    key={item}
                                    to={getLinkPath(item)}
                                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleLinkClick(e, item)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors duration-150 ${isActive(item)
                                        ? 'bg-white text-black'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {navIcons[item]}
                                    {navLabels[item]}
                                </Link>
                            ))}
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className="lg:hidden p-2 text-white/70 hover:text-white transition-colors duration-150"
                            onClick={onMobileMenuOpen}
                            aria-label="Open menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </>
                )}
            </div>
        </header>
    );
};
