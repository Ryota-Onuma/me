'use client';

import React, { useEffect, useState, useId, memo, useMemo } from 'react';
import mermaid from 'mermaid';
import { CopyButton } from './CopyButton';

mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'strict', // Use strict mode for security
    fontFamily: 'Inter, system-ui, sans-serif',
    themeVariables: {
        primaryColor: '#76b5c5',
        primaryTextColor: '#1a1a1a',
        primaryBorderColor: '#76b5c5',
        lineColor: '#1a1a1a',
        secondaryColor: '#f0f9fa',
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
        <div className="relative my-12 group">
            {!error && (
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-black/5 shadow-sm">
                        <CopyButton
                            text={chart}
                            className="text-black/50 hover:text-black hover:bg-black/5"
                        />
                    </div>
                </div>
            )}
            <div
                className="flex justify-center bg-white rounded-3xl border border-black/10 p-8 md:p-12 overflow-x-auto shadow-sm"
                style={{ minHeight: DIAGRAM_CONTAINER_MIN_HEIGHT }}
            >
                {error ? (
                    <div className="flex items-center justify-center w-full">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    </div>
                ) : svg ? (
                    <div dangerouslySetInnerHTML={{ __html: svg }} />
                ) : isRendering ? (
                    <div className="text-black/30 text-sm">Loading diagram...</div>
                ) : null}
            </div>
        </div>
    );
};

// Memoize to prevent re-renders when parent re-renders
export const Mermaid = memo(MermaidInner);
