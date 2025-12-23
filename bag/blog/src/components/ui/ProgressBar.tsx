import { motion, MotionValue } from 'framer-motion';

interface ProgressBarProps {
    scaleX: MotionValue<number>;
}

/**
 * ProgressBar - スクロール進行状況表示バー
 */
export const ProgressBar = ({ scaleX }: ProgressBarProps) => (
    <motion.div
        className="fixed top-0 left-0 right-0 h-px bg-white/40 origin-left z-[1100]"
        style={{ scaleX }}
    />
);
