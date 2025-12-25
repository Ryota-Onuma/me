/**
 * Spotlight - Static gradient spotlight (removed motion tracking for performance)
 */
export const Spotlight = () => (
    <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 255, 255, 0.03) 0%, transparent 60%)',
        }}
    />
);
