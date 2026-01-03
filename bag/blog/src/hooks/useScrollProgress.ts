'use client';

import { useEffect, useState } from 'react';

interface UseScrollProgressReturn {
    scrollProgress: number;
}

/**
 * useScrollProgress - スクロール進行状況管理フック (vanilla JS)
 */
export const useScrollProgress = (): UseScrollProgressReturn => {
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? scrollTop / docHeight : 0;
            setScrollProgress(progress);
        };

        window.addEventListener('scroll', updateProgress, { passive: true });
        return () => window.removeEventListener('scroll', updateProgress);
    }, []);

    return { scrollProgress };
};
