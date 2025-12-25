interface ProgressBarProps {
    scrollProgress: number;
}

/**
 * ProgressBar - スクロール進行状況表示バー (CSS-only)
 */
export const ProgressBar = ({ scrollProgress }: ProgressBarProps) => (
    <div
        className="fixed top-0 left-0 right-0 h-px bg-white/40 origin-left z-[1100]"
        style={{ transform: `scaleX(${scrollProgress})` }}
    />
);
