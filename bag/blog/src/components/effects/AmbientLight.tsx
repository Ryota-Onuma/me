import { useState } from 'react';

interface Particle {
    id: number;
    left: string;
    duration: number;
    delay: number;
    size: number;
}

// Generate particles outside of render to avoid purity issues
const generateParticles = (): Particle[] =>
    [...Array(15)].map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        duration: Math.random() * 20 + 20,
        delay: Math.random() * -20,
        size: Math.random() * 1.5 + 0.5
    }));

/**
 * AmbientLight - アンビエント・パーティクル：光の粒子
 */
export const AmbientLight = () => {
    // Use useState with initializer to generate particles once on mount
    const [particles] = useState<Particle[]>(generateParticles);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute bg-white opacity-10 rounded-full animate-float-up"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: p.left,
                        bottom: '-10%',
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                    }}
                />
            ))}
        </div>
    );
};
