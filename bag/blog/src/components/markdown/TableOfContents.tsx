'use client';

import React, { useMemo } from 'react';

interface Heading {
    text: string;
    id: string;
}

interface TableOfContentsProps {
    content: string;
}

export const TableOfContents = ({ content }: TableOfContentsProps): React.ReactNode => {
    const headings = useMemo((): Heading[] => {
        const matches = Array.from(content.matchAll(/^## (.*)$/gm));
        return matches.map(match => ({
            text: match[1],
            id: match[1].toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
        }));
    }, [content]);

    if (headings.length === 0) return null;

    return (
        <nav className="mb-12 p-6 bg-white border border-black/5 rounded-2xl shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-black/40">Contents</p>
            <ul className="space-y-3">
                {headings.map(h => (
                    <li key={h.id}>
                        <a
                            href={`#${h.id}`}
                            className="text-sm font-bold text-black/60 hover:text-black transition-colors flex items-center gap-2 group"
                        >
                            <span className="w-1 h-1 bg-black/20 rounded-full group-hover:bg-black transition-colors" />
                            {h.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
