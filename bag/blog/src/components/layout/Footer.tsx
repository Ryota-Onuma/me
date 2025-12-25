import { Github } from 'lucide-react';

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const SOCIAL_LINKS = [
    { label: 'GitHub', href: 'https://github.com/Ryota-Onuma', icon: Github },
    { label: 'X', href: 'https://x.com/and_and_and30', icon: XIcon },
];

/**
 * Footer - Redesigned structured footer
 */
export const Footer = () => (
    <footer className="py-16 md:py-20 px-6 md:px-20 bg-[#080808] text-[#f0f0f0] border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12 md:gap-8">
            {/* Socials */}
            <div className="flex flex-wrap gap-4">
                {SOCIAL_LINKS.map((link) => (
                    <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                    >
                        <link.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{link.label}</span>
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
