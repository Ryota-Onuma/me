import { motion, MotionValue, useTransform } from 'framer-motion';

interface SpotlightProps {
    lightX: MotionValue<number>;
    lightY: MotionValue<number>;
}

/**
 * Spotlight - マウス追従のソフトスポットライト
 */
export const Spotlight = ({ lightX, lightY }: SpotlightProps) => {
    const background = useTransform(
        [lightX, lightY],
        ([x, y]) =>
            `radial-gradient(1200px circle at ${x}px ${y}px, rgba(255, 255, 255, 0.04) 0%, transparent 70%)`
    );

    return (
        <motion.div
            className="fixed inset-0 pointer-events-none z-0 opacity-20"
            style={{ background }}
        />
    );
};
