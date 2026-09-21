import React from 'react';
import GithubSlugger from 'github-slugger';

interface Heading {
    text: string;
    id: string;
}

interface TableOfContentsProps {
    content: string;
}

export const TableOfContents = ({ content }: TableOfContentsProps): React.ReactNode => {
    const headings = (() => {
        const matches = Array.from(content.matchAll(/^(#{1,6})[\t ]+(.+?)[\t ]*#*[\t ]*$/gm));
        const slugger = new GithubSlugger();

        return matches.reduce<Heading[]>((items, match) => {
            const depth = match[1].length;
            const text = match[2]
                .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
                .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
                .replace(/[`*_~]/g, '');
            // rehype-slug processes every heading with github-slugger. Running
            // every level through the same slugger keeps duplicate suffixes in sync.
            const id = slugger.slug(text);

            if (depth === 2) items.push({ text, id });
            return items;
        }, []);
    })();

    if (headings.length === 0) return null;

    return (
        <nav className="retro-toc" aria-label="目次">
            <p>目次</p>
            <ul>
                {headings.map(h => (
                    <li key={h.id}>
                        <a href={`#${h.id}`}>{h.text}</a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
