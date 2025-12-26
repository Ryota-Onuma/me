import { Github, ArrowUpRight } from 'lucide-react';

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

import { SectionHeading } from '../ui/SectionHeading';

const SOCIAL_LINKS = [
    {
        label: 'GitHub',
        href: 'https://github.com/Ryota-Onuma',
        icon: Github,
    },
    {
        label: 'X',
        href: 'https://x.com/and_and_and30',
        icon: XIcon,
    },
];

export const AboutSection = () => (
    <section
        id="about"
        className="py-20 md:py-32 px-6 md:px-24 bg-[#050505] overflow-hidden"
    >
        <div className="max-w-7xl mx-auto w-full">
            <SectionHeading title="About" />

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 md:gap-24 items-start">

                {/* Bio Text - Left Side (Asymmetric priority) */}
                <div className="space-y-10 order-2 lg:order-1">
                    <div className="animate-fade-in-up">
                        <p className="text-xs uppercase tracking-[0.4em] text-accent font-black mb-4">
                            Software Engineer
                        </p>
                        <h3 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                            Ryota Onuma
                        </h3>
                    </div>

                    <div className="space-y-8 max-w-2xl">
                        <p className="text-white/90 leading-relaxed text-xl md:text-2xl font-semibold tracking-tight">
                            長野県出身のソフトウェアエンジニア。
                        </p>
                        <p className="text-white/50 leading-relaxed text-lg md:text-xl font-medium">
                            Go、Kotlin、TypeScript あたりをよく書く。最近はフィリピンのチームと協業している。<br className="hidden md:block" />
                            好奇心を持ち続けること、動き続けることを大切にしている。
                        </p>
                    </div>

                    {/* Social Links */}
                    <div className="pt-6 flex flex-wrap gap-4">
                        {SOCIAL_LINKS.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/link flex items-center gap-4 px-8 py-4 rounded-full bg-white/[0.03] border border-white/10 text-white/60 transition-premium hover:text-accent hover:border-accent/40 hover:bg-accent/5 hover:scale-105"
                            >
                                <link.icon className="w-5 h-5" />
                                <span className="text-sm font-black uppercase tracking-widest">{link.label}</span>
                                <ArrowUpRight className="w-4 h-4 opacity-0 -ml-2 group-hover/link:opacity-100 group-hover/link:ml-0 transition-premium" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Profile Image - Right Side (Tilted/Offset) */}
                <div className="relative group flex justify-center lg:justify-end order-1 lg:order-2">
                    <div className="aspect-[4/5] w-full max-w-[400px] relative lg:rotate-2 group-hover:rotate-0 transition-premium duration-1000">
                        {/* Glow effect */}
                        <div className="absolute -inset-4 bg-accent/20 rounded-3xl blur-3xl opacity-0 group-hover:opacity-40 transition-premium duration-1000" />

                        {/* Image container */}
                        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 group-hover:border-accent/30 shadow-2xl transition-premium duration-1000">
                            <img
                                src="/profile.jpg"
                                alt="Ryota Onuma"
                                className="w-full h-full object-cover lg:grayscale lg:brightness-90 group-hover:lg:grayscale-0 group-hover:lg:brightness-100 transition-premium duration-1000 ease-out group-hover:scale-105"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>
);
