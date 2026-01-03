'use client';

import React, { useEffect, useState, useId } from 'react';
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

interface MermaidProps {
    chart: string;
}

export const Mermaid = ({ chart }: MermaidProps): React.ReactNode => {
    const [svg, setSvg] = useState<string | null>(null);
    const id = useId();
    const containerId = `mermaid${id.replace(/:/g, '-')}`;

    useEffect(() => {
        let cancelled = false;
        const renderChart = async () => {
            try {
                const { svg } = await mermaid.render(containerId, chart);
                if (!cancelled) {
                    setSvg(svg);
                }
            } catch (err) {
                console.error('Mermaid rendering failed:', err);
            }
        };
        renderChart();
        return () => { cancelled = true; };
    }, [chart, containerId]);

    return (
        <div className="relative my-12 group">
            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/80 backdrop-blur-md rounded-xl border border-black/5 shadow-sm">
                    <CopyButton text={chart} />
                </div>
            </div>
            <div
                className="flex justify-center bg-white rounded-3xl border border-black/10 p-8 md:p-12 overflow-x-auto shadow-sm min-h-[100px]"
            >
                {svg ? (
                    <div dangerouslySetInnerHTML={{ __html: svg }} />
                ) : (
                    <div className="text-black/30 text-sm">Loading diagram...</div>
                )}
            </div>
        </div>
    );
};
