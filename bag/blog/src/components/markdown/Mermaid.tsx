'use client';

import React, { useEffect, useState, useId, memo } from 'react';
import mermaid from 'mermaid';
import { CopyButton } from './CopyButton';

mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
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

interface MermaidProps {
    chart: string;
}

const MermaidInner = ({ chart }: MermaidProps): React.ReactNode => {
    // Initialize with cached value if available
    const [svg, setSvg] = useState<string | null>(() => svgCache.get(chart) ?? null);
    const [isRendering, setIsRendering] = useState(!svgCache.has(chart));
    const id = useId();

    useEffect(() => {
        // If already cached, no need to render
        const cachedSvg = svgCache.get(chart);
        if (cachedSvg) {
            setSvg(cachedSvg);
            setIsRendering(false);
            return;
        }

        let cancelled = false;
        const containerId = `mermaid-${id.replace(/:/g, '-')}-${Date.now()}`;

        const renderChart = async () => {
            try {
                const { svg: renderedSvg } = await mermaid.render(containerId, chart);
                if (!cancelled) {
                    svgCache.set(chart, renderedSvg);
                    setSvg(renderedSvg);
                    setIsRendering(false);
                }
            } catch (err) {
                console.error('Mermaid rendering failed:', err);
                setIsRendering(false);
            }
        };

        renderChart();
        return () => { cancelled = true; };
    }, [chart, id]);

    return (
        <div className="relative my-12 group">
            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/80 backdrop-blur-md rounded-xl border border-black/5 shadow-sm">
                    <CopyButton text={chart} />
                </div>
            </div>
            <div
                className="flex justify-center bg-white rounded-3xl border border-black/10 p-8 md:p-12 overflow-x-auto shadow-sm"
                style={{ minHeight: DIAGRAM_CONTAINER_MIN_HEIGHT }}
            >
                {svg ? (
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
