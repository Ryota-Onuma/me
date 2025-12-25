/**
 * HeroSection - ヒーローセクション (CSS animations for better performance)
 */
export const HeroSection = () => (
    <section
        id="home"
        className="relative h-dvh flex flex-col items-center justify-center text-center px-6 pt-24 md:pt-32 overflow-hidden"
    >
        <div className="z-10 mix-blend-difference animate-fade-in-up">
            <h1 className="text-[13vw] sm:text-[10vw] md:text-[11vw] font-black tracking-tighter leading-[0.9] italic uppercase select-none transition-all duration-500 hover:scale-[1.02] hover:tracking-normal">
                STAY <span className="text-outline-white transition-opacity duration-700 hover:opacity-80">CURIOUS.</span><br />
                KEEP <span className="text-white relative inline-block after:content-[''] after:absolute after:bottom-2 after:left-0 after:w-full after:h-[2px] after:bg-white after:scale-x-0 after:origin-right after:transition-transform after:duration-500 hover:after:scale-x-100 hover:after:origin-left">MOVING.</span>
            </h1>


        </div>
    </section>
);
