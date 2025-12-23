import { motion } from 'framer-motion';

/**
 * HeroSection - ヒーローセクション
 */
export const HeroSection = () => (
    <section
        id="home"
        className="relative h-dvh flex flex-col items-center justify-center text-center px-6 pt-24 md:pt-32 overflow-hidden"
    >
        <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="z-10 mix-blend-difference"
        >
            <h1 className="text-[12vw] sm:text-[9vw] md:text-[10vw] font-black tracking-tight leading-[1.0] sm:leading-[0.8] italic uppercase select-none">
                STAY <span className="text-outline-white transition-opacity duration-700 hover:opacity-80">CURIOUS.</span><br />
                KEEP <span className="text-white">MOVING.</span>
            </h1>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
            >
                <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent" />
            </motion.div>
        </motion.div>
    </section>
);
