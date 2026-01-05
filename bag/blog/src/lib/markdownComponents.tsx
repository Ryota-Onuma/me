'use client';

import React from 'react';
import type { Components } from 'react-markdown';
import {
    Mermaid, AlertBlock, CodeBlock, getAlertType,
    DetailsBlock, EmbedBlock, LinkCardClient
} from '@/components/markdown';
import type { OGPData } from '@/lib/prefetchOGP';

// Type definitions for custom markdown components
interface HeadingComponentProps {
    children?: React.ReactNode;
    id?: string;
}

interface CodeComponentProps {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}

interface BlockquoteComponentProps {
    children?: React.ReactNode;
}

interface ImageComponentProps {
    src?: string;
    alt?: string;
    width?: string | number;
}

interface MessageComponentProps {
    children?: React.ReactNode;
    type?: string;
}

interface DetailsComponentProps {
    children?: React.ReactNode;
    title?: string;
}

interface EmbedComponentProps {
    id?: string;
}

interface LinkCardComponentProps {
    url?: string;
}

interface ParagraphComponentProps {
    children?: React.ReactNode;
}

/**
 * Create markdown components for ReactMarkdown.
 * Extracted from BlogDetailClient for better maintainability.
 * 
 * @param ogpDataMap - Pre-fetched OGP data mapped by URL (optional)
 * 
 * Note: Custom directive components (message, youtube, twitter, etc.) are not part
 * of react-markdown's standard Components type, so we use type assertion.
 */
export const createMarkdownComponents = (ogpDataMap?: Record<string, OGPData>): Partial<Components> => ({
    // Override p to handle block elements (prevents hydration errors)
    p: ({ children }: ParagraphComponentProps) => {
        // Check if children contain block elements (figure, div, img, etc.)
        const hasBlockChild = React.Children.toArray(children).some(
            (child) => {
                if (!React.isValidElement(child)) return false;
                const typeName = typeof child.type === 'string'
                    ? child.type
                    : (child.type as React.ComponentType)?.displayName ||
                    (child.type as React.ComponentType)?.name || '';
                return ['figure', 'div', 'img', 'youtube', 'twitter', 'github', 'link-card'].includes(typeName);
            }
        );
        if (hasBlockChild) {
            return <>{children}</>;
        }
        return <p>{children}</p>;
    },

    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,

    h1: ({ children }: HeadingComponentProps) => (
        <h1 className="scroll-mt-24">{children}</h1>
    ),

    h2: ({ children, id }: HeadingComponentProps) => (
        <h2 id={id} className="scroll-mt-24">{children}</h2>
    ),

    h3: ({ children, id }: HeadingComponentProps) => (
        <h3 id={id} className="scroll-mt-24">{children}</h3>
    ),

    h4: ({ children, id }: HeadingComponentProps) => (
        <h4 id={id} className="scroll-mt-24">{children}</h4>
    ),

    code({ inline, className, children }: CodeComponentProps) {
        const match = /language-([^{:]+)(?::([^{]+))?(?:\{([^}]+)\})?/.exec(className || '');
        const codeString = String(children);

        if (!inline && match && match[1] === 'mermaid') {
            return <Mermaid chart={codeString} />;
        }

        if (!inline && match) {
            return (
                <CodeBlock
                    language={match[1]}
                    filename={match[2]}
                    highlightLines={match[3]}
                    code={codeString}
                />
            );
        }

        return (
            <code className={`${className ?? ''} bg-black/10 px-1.5 py-0.5 rounded font-mono text-sm font-bold text-accent`}>
                {children}
            </code>
        );
    },

    blockquote({ children }: BlockquoteComponentProps) {
        const alertType = getAlertType(children);

        if (alertType) {
            return <AlertBlock type={alertType}>{children}</AlertBlock>;
        }

        return (
            <blockquote className="border-l-4 border-black/10 pl-6 my-8 italic text-black/60">
                {children}
            </blockquote>
        );
    },

    img: (({ src, alt, width }: ImageComponentProps) => {
        return (
            <figure className="my-8 flex flex-col items-center">
                <img
                    src={src}
                    alt={alt || ''}
                    width={width}
                    className="rounded-2xl border border-black/10 shadow-sm transition-transform hover:scale-[1.01]"
                />
                {alt && alt !== '' && (
                    <figcaption className="mt-4 text-xs font-medium text-black/40 tracking-wider uppercase">
                        {alt}
                    </figcaption>
                )}
            </figure>
        );
    }) as Components['img'],

    // Support for custom markdown tags (via remarkCustomDirectives hName mapping)
    message: ({ children, type }: MessageComponentProps) => {
        const typeMap: Record<string, any> = {
            info: 'NOTE',
            tip: 'TIP',
            alert: 'WARNING',
            warning: 'WARNING',
            important: 'IMPORTANT',
            caution: 'CAUTION'
        };
        const alertType = typeMap[type || 'info'] || 'NOTE';
        return <AlertBlock type={alertType}>{children}</AlertBlock>;
    },

    details: ({ children, title }: DetailsComponentProps) => {
        return <DetailsBlock title={title}>{children}</DetailsBlock>;
    },

    youtube: ({ id }: EmbedComponentProps) => <EmbedBlock type="youtube" id={id ?? ''} />,
    twitter: ({ id }: EmbedComponentProps) => <EmbedBlock type="twitter" id={id ?? ''} />,
    github: ({ id }: EmbedComponentProps) => <EmbedBlock type="github" id={id ?? ''} />,
    gist: ({ id }: EmbedComponentProps) => <EmbedBlock type="gist" id={id ?? ''} />,
    codepen: ({ id }: EmbedComponentProps) => <EmbedBlock type="codepen" id={id ?? ''} />,
    slideshare: ({ id }: EmbedComponentProps) => <EmbedBlock type="slideshare" id={id ?? ''} />,
    speakerdeck: ({ id }: EmbedComponentProps) => <EmbedBlock type="speakerdeck" id={id ?? ''} />,
    docswell: ({ id }: EmbedComponentProps) => <EmbedBlock type="docswell" id={id ?? ''} />,
    jsfiddle: ({ id }: EmbedComponentProps) => <EmbedBlock type="jsfiddle" id={id ?? ''} />,
    codesandbox: ({ id }: EmbedComponentProps) => <EmbedBlock type="codesandbox" id={id ?? ''} />,
    stackblitz: ({ id }: EmbedComponentProps) => <EmbedBlock type="stackblitz" id={id ?? ''} />,
    figma: ({ id }: EmbedComponentProps) => <EmbedBlock type="figma" id={id ?? ''} />,
    'link-card': ({ url }: LinkCardComponentProps) => (
        <LinkCardClient url={url ?? ''} ogpData={ogpDataMap?.[url ?? '']} />
    )
} as Partial<Components>);


