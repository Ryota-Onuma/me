'use client';

import React, { useEffect, useState, useId, memo, useMemo } from 'react';
import mermaid from 'mermaid';
import { CopyButton } from './CopyButton';

mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'strict', // Use strict mode for security
    fontFamily: 'MS PGothic, Osaka, sans-serif',
    themeVariables: {
        primaryColor: '#eeeeee',
        primaryTextColor: '#000000',
        primaryBorderColor: '#000066',
        lineColor: '#333333',
        secondaryColor: '#ffffdd',
        tertiaryColor: '#ffffff',
    }
});

// Global cache for rendered SVGs to persist across re-mounts
const svgCache = new Map<string, string>();

// Constants
const DIAGRAM_CONTAINER_MIN_HEIGHT = '100px';
const MAX_CHART_LENGTH = 10000; // Maximum allowed chart size to prevent DoS

interface MermaidProps {
    chart: string;
}

const MermaidInner = ({ chart }: MermaidProps): React.ReactNode => {
    const id = useId();

    // Validate chart input (memoized to avoid recalculation)
    const validationResult = useMemo(() => {
        const trimmedChart = chart.trim();

        if (trimmedChart.length === 0) {
            return { valid: false, error: 'Empty diagram content', trimmedChart };
        }

        if (trimmedChart.length > MAX_CHART_LENGTH) {
            return { valid: false, error: `Diagram too large (max ${MAX_CHART_LENGTH} characters)`, trimmedChart };
        }

        return { valid: true, error: null, trimmedChart };
    }, [chart]);

    // Initialize with cached value if available
    const [svg, setSvg] = useState<string | null>(() =>
        validationResult.valid ? svgCache.get(validationResult.trimmedChart) ?? null : null
    );
    const [renderError, setRenderError] = useState<string | null>(null);

    // Use validation error or render error
    const error = validationResult.error || renderError;

    // Compute isRendering based on current state
    const isRendering = validationResult.valid &&
                       !svg &&
                       !error &&
                       !svgCache.has(validationResult.trimmedChart);

    useEffect(() => {
        // Skip if validation failed or already have SVG (cached or rendered)
        if (!validationResult.valid || svg) {
            return;
        }

        const trimmedChart = validationResult.trimmedChart;

        // Skip if already cached (shouldn't happen due to check above, but defensive)
        if (svgCache.has(trimmedChart)) {
            return;
        }

        let cancelled = false;
        const containerId = `mermaid-${id.replace(/:/g, '-')}-${Date.now()}`;

        const renderChart = async () => {
            try {
                const { svg: renderedSvg } = await mermaid.render(containerId, trimmedChart);
                if (!cancelled) {
                    svgCache.set(trimmedChart, renderedSvg);
                    setSvg(renderedSvg);
                    setRenderError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    console.error('Mermaid rendering failed:', errorMessage);
                    setRenderError(`Failed to render diagram: ${errorMessage}`);
                }
            }
        };

        renderChart();
        return () => { cancelled = true; };
    }, [validationResult, svg, id]);

    return (
        <figure className="not-prose retro-mermaid">
            {!error && (
                <div className="retro-mermaid-tools">
                    <CopyButton text={chart} />
                </div>
            )}
            <div
                className="retro-mermaid-canvas"
                style={{ minHeight: DIAGRAM_CONTAINER_MIN_HEIGHT }}
            >
                {error ? (
                    <p className="retro-mermaid-error">{error}</p>
                ) : svg ? (
                    <div dangerouslySetInnerHTML={{ __html: svg }} />
                ) : isRendering ? (
                    <p>Loading diagram...</p>
                ) : null}
            </div>
            <figcaption>Diagram</figcaption>
        </figure>
    );
};

// Memoize to prevent re-renders when parent re-renders
export const Mermaid = memo(MermaidInner);
