/**
 * NoiseOverlay - CSS-only noise texture (much lighter than SVG filter)
 */
export const NoiseOverlay = () => (
    <div
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-overlay"
        style={{
            backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAGFBMVEUAAAA5OTkAAABMTExERERmZmYzMzMyMjIxMTE3CN0CAAAABXRSTlMvMzMzM7YOwJ8AAAAkSURBVDjLY2AAgpNlzYAIqygIFFhoAEX2OlOAgQq7EqC+qgAAhCUCgR02/TQAAAAASUVORK5CYII=")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
        }}
    />
);
