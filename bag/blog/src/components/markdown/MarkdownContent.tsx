import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import remarkGemoji from 'remark-gemoji';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

import { remarkCustomDirectives } from '@/lib/remarkCustomDirectives';
import { createMarkdownComponents } from '@/lib/markdownComponents';
import type { OGPData } from '@/lib/prefetchOGP';

interface MarkdownContentProps {
    content: string;
    headingOffset?: boolean;
    ogpDataMap?: Record<string, OGPData>;
}

/** Render Markdown on the server; only interactive descendants hydrate. */
export async function MarkdownContent({ content, headingOffset = false, ogpDataMap }: MarkdownContentProps) {
    const MermaidComponent = /```mermaid(?:\s|$)/i.test(content)
        ? (await import('./Mermaid')).Mermaid
        : undefined;

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkGemoji, remarkCustomDirectives]}
            rehypePlugins={[rehypeKatex, rehypeSlug, rehypeRaw]}
            components={createMarkdownComponents(ogpDataMap, { headingOffset, MermaidComponent })}
        >
            {content}
        </ReactMarkdown>
    );
}
