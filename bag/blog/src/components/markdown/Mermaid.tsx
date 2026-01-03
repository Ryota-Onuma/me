'use client';

import React, { useEffect, useState, useMemo } from 'react';
import mermaid from 'mermaid';
import { CopyButton } from './CopyButton';

mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif',
});

interface MermaidProps {
    chart: string;
}

export const Mermaid = ({ chart }: MermaidProps): React.ReactNode => {
    const [svg, setSvg] = useState('');
    const containerId = useMemo(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`, []);

    useEffect(() => {
        const renderChart = async () => {
            try {
                const { svg } = await mermaid.render(containerId, chart);
                setSvg(svg);
            } catch (err) {
                console.error('Mermaid rendering failed:', err);
            }
        };
        renderChart();
    }, [chart, containerId]);

    return (
        <div className="relative my-8">
            <div className="absolute top-2 right-2 z-10 bg-gray-800 rounded-md">
                <CopyButton text={chart} />
            </div>
            <div
                className="flex justify-center bg-black/5 p-6 rounded-2xl border border-black/5 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </div>
    );
};
