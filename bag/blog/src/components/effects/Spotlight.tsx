import { useState, useEffect } from 'react';

/**
 * Spotlight - Dynamic mouse-tracking gradient spotlight
 */
export const Spotlight = () => {
    const [mousePos, setMousePos] = useState({ x: 50, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
            style={{
                background: `radial-gradient(circle 800px at ${mousePos.x}% ${mousePos.y}%, rgba(59, 130, 246, 0.05), transparent 80%)`,
            }}
        />
    );
};
