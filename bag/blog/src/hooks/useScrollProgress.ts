import { useScroll, useSpring, MotionValue } from 'framer-motion';

interface UseScrollProgressReturn {
    scrollYProgress: MotionValue<number>;
    scaleX: MotionValue<number>;
}

/**
 * useScrollProgress - スクロール進行状況管理フック
 */
export const useScrollProgress = (): UseScrollProgressReturn => {
    const { scrollYProgress } = useScroll();

    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return { scrollYProgress, scaleX };
};
