import { ArrowUpRight } from 'lucide-react';
import { SectionHeading } from '../ui/SectionHeading';
import { SOCIAL_LINKS } from '@/data/socialLinks';

export const AboutSection = () => (
    <section
        id="about"
        className="pt-28 pb-16 md:pt-32 md:pb-20 px-6 md:px-16 lg:px-24 bg-[#fafafa] overflow-hidden"
    >
        <div className="w-full">
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
                        <p className="text-black/50 leading-relaxed text-lg md:text-xl font-medium italic">
                            Stay curious.
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
                                className="group/link flex items-center gap-4 px-8 py-4 rounded-full bg-black/[0.02] border border-black/10 text-black/60 transition-premium hover:text-accent hover:border-accent/40 hover:bg-accent/5 hover:scale-105"
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
                        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-black/10 group-hover:border-accent/30 shadow-2xl transition-premium duration-1000">
                            <img
                                src="/profile.jpg"
                                alt="Ryota Onuma"
                                className="w-full h-full object-cover transition-premium duration-1000 ease-out group-hover:scale-105"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>
);
