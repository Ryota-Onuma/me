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
        <footer className="py-12 md:py-14 px-6 md:px-20 bg-[#f3f3f1] text-[#1a1a1a] border-t border-black/10">
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
                                className="flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-black/10 text-black/60 hover:text-black hover:border-black/20 transition-all duration-200"
                            >
                                <link.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{link.label}</span>
                            </a>
                        ))}
                    </div>
                )}

                {/* Info */}
                <div className="flex flex-col items-center text-center gap-1">
                    <p className="text-xs text-black/55 font-medium whitespace-nowrap">
                        © ryota.onuma.dev <span className="mx-2 md:mx-6 opacity-30">/</span> 2025 Edition
                    </p>
                </div>
            </div>
        </footer>
    );
};
