import { ArrowUpRight } from 'lucide-react';

interface FooterLink {
    label: string;
    href: string;
}

const SOCIAL_LINKS: FooterLink[] = [
    { label: 'Twitter', href: '#' },
    { label: 'GitHub', href: '#' },
    { label: 'LinkedIn', href: '#' }
];

/**
 * Footer - Redesigned structured footer
 */
export const Footer = () => (
    <footer className="py-16 md:py-20 px-6 md:px-20 bg-[#080808] text-[#f0f0f0] border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12 md:gap-8">
            {/* Socials */}
            <div className="flex flex-wrap gap-8 md:gap-12">
                {SOCIAL_LINKS.map((link) => (
                    <a
                        key={link.label}
                        href={link.href}
                        className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-white/50 hover:text-white transition-colors w-fit"
                    >
                        {link.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                    </a>
                ))}
            </div>

            {/* Info */}
            <div className="flex flex-col md:items-end text-left md:text-right gap-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
                    © Ryota Onuma <span className="mx-2 md:mx-4 opacity-50">/</span> 2025 Edition
                </p>
            </div>
        </div>
    </footer>
);
