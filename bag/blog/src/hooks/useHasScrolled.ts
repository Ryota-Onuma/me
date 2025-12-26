import { useEffect, useState } from 'react';

const DEFAULT_SCROLL_THRESHOLD = 50;

interface UseHasScrolledReturn {
    isScrolled: boolean;
}

/**
 * useHasScrolled - スクロール閾値判定フック
 * @param threshold - スクロール閾値（デフォルト: 50px）
 */
export const useHasScrolled = (threshold = DEFAULT_SCROLL_THRESHOLD): UseHasScrolledReturn => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > threshold);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [threshold]);

    return { isScrolled };
};
