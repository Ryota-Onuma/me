import { ArrowUpRight } from 'lucide-react';
import { SectionHeading } from '../ui/SectionHeading';
import { SOCIAL_LINKS } from '@/data/socialLinks';

export const AboutSection = () => (
    <section
        id="about"
        className="pt-28 pb-16 md:pt-32 md:pb-20 px-6 md:px-16 lg:px-24 bg-[#fbfbfa] overflow-hidden"
    >
        <div className="w-full">
            <SectionHeading title="About" />

            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 md:gap-20 items-start max-w-6xl">

                {/* Bio Text - Left Side (Asymmetric priority) */}
                <div className="space-y-9 order-2 lg:order-1">
                    <div>
                        <p className="text-sm text-accent-hover font-medium mb-3">
                            Software Engineer
                        </p>
                        <h3 className="text-4xl md:text-6xl font-semibold leading-tight">
                            Ryota Onuma
                        </h3>
                    </div>

                    <div className="space-y-8 max-w-2xl">
                        <p className="text-black/50 leading-relaxed text-lg md:text-xl font-medium italic">
                            Stay curious.
                        </p>
                    </div>

                    {/* Social Links */}
                    <div className="pt-4 flex flex-wrap gap-3">
                        {SOCIAL_LINKS.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/link flex items-center gap-3 px-4 py-3 rounded-md bg-white border border-black/10 text-black/60 transition-premium hover:text-black hover:border-black/20"
                            >
                                <link.icon className="w-5 h-5" />
                                <span className="text-sm font-medium">{link.label}</span>
                                <ArrowUpRight className="w-4 h-4 opacity-45" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Profile Image */}
                <div className="relative group flex justify-center lg:justify-end order-1 lg:order-2">
                    <div className="aspect-[4/5] w-full max-w-[380px] relative">
                        <div className="relative w-full h-full rounded-lg overflow-hidden border border-black/10 bg-white">
                            <img
                                src="/profile.jpg"
                                alt="Ryota Onuma"
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>
);
