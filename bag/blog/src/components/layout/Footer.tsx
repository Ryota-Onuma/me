'use client';

import { usePathname } from 'next/navigation';
import { SOCIAL_LINKS } from '@/data/socialLinks';

/**
 * Footer - Redesigned structured footer
 */
export const Footer = () => {
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    return (
        <footer className="py-16 md:py-20 px-6 md:px-20 bg-[#f5f5f5] text-[#1a1a1a] border-t border-black/10">
            <div className="max-w-7xl mx-auto flex flex-col items-center gap-12 md:gap-8">
                {/* Socials */}
                {!isHomePage && (
                    <div className="flex flex-wrap justify-center gap-4">
                        {SOCIAL_LINKS.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 border border-black/10 text-black/60 hover:text-black hover:bg-black/10 hover:border-black/20 transition-all duration-200"
                            >
                                <link.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{link.label}</span>
                            </a>
                        ))}
                    </div>
                )}

                {/* Info */}
                <div className="flex flex-col items-center text-center gap-1">
                    <p className="text-[10px] md:text-[12px] uppercase tracking-[0.15em] md:tracking-[0.4em] text-black/60 font-bold whitespace-nowrap">
                        © ryota.onuma.dev <span className="mx-2 md:mx-6 opacity-30">/</span> 2025 Edition
                    </p>
                </div>
            </div>
        </footer>
    );
};
