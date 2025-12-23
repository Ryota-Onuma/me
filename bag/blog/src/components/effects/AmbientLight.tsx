import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
    id: number;
    left: string;
    duration: number;
    delay: number;
    size: number;
}

/**
 * AmbientLight - アンビエント・パーティクル：光の粒子
 */
export const AmbientLight = () => {
    const particles = useMemo<Particle[]>(() =>
        [...Array(15)].map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            duration: Math.random() * 20 + 20,
            delay: Math.random() * -20,
            size: Math.random() * 1.5 + 0.5
        })),
        []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute bg-white opacity-10 rounded-full"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: p.left,
                        bottom: '-10%',
                    }}
                    animate={{
                        y: [0, -1200],
                        opacity: [0, 0.2, 0],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: p.delay
                    }}
                />
            ))}
        </div>
    );
};
