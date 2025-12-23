/**
 * NoiseOverlay - 視覚的テクスチャ：微細なノイズ
 */
export const NoiseOverlay = () => (
    <div
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.02]"
        style={{ mixBlendMode: 'overlay' }}
    >
        <svg
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            <filter id="noise">
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.65"
                    numOctaves={3}
                    stitchTiles="stitch"
                />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
    </div>
);
