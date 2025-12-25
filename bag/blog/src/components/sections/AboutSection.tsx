import { Github } from 'lucide-react';

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

/**
 * AboutSection - About Me セクション (CSS animations for performance)
 */
import { SectionHeading } from '../ui/SectionHeading';

// ...

export const AboutSection = () => (
    <section
        id="about"
        className="py-20 md:py-40 px-6 md:px-24 bg-[#050505]"
    >
        <SectionHeading title="About" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Profile Image */}
            <div className="relative">
                <div className="aspect-square max-w-[400px] mx-auto relative">
                    <div className="absolute inset-0 border border-white/10 translate-x-4 translate-y-4" />
                    <div className="relative w-full h-full border border-white/10 overflow-hidden">
                        <img
                            src="/profile.jpg"
                            alt="Ryota Onuma"
                            className="w-full h-full object-cover object-center"
                        />
                    </div>
                </div>
            </div>

            {/* Bio Text */}
            <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Ryota Onuma
                </h3>
                <p className="text-white/60 leading-relaxed text-sm md:text-base">
                    長野県出身のソフトウェアエンジニア。Go、Kotlin、TypeScriptあたりをよく書く。最近はフィリピンのチームと協業している。
                </p>


                {/* Social Links */}
                <div className="pt-6 flex gap-4">
                    <a
                        href="https://github.com/Ryota-Onuma"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                    >
                        <Github className="w-4 h-4" />
                        <span className="text-sm font-medium">GitHub</span>
                    </a>
                    <a
                        href="https://x.com/and_and_and30"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                    >
                        <XIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">X</span>
                    </a>
                </div>
            </div>
        </div>
    </section>
);
