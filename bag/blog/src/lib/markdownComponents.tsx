'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { Components } from 'react-markdown';
import { AlertBlock, getAlertType, type AlertType } from '@/components/markdown/AlertBlock';
import { DetailsBlock } from '@/components/markdown/DetailsBlock';
import { EmbedBlock } from '@/components/markdown/EmbedBlock';
import { LinkCardClient } from '@/components/markdown/LinkCardClient';
import type { OGPData } from '@/lib/prefetchOGP';

// Syntax highlighting and diagram rendering are the two heaviest widgets on a
// detail page. Keep them out of the initial bundle unless the Markdown uses them.
const CodeBlock = dynamic(
    () => import('@/components/markdown/CodeBlock').then(module => module.CodeBlock),
    { loading: () => <p className="retro-widget-loading">コードを読み込み中...</p> }
);
const Mermaid = dynamic(
    () => import('@/components/markdown/Mermaid').then(module => module.Mermaid),
    { loading: () => <p className="retro-widget-loading">図を読み込み中...</p> }
);

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

interface MarkdownComponentOptions {
    /** Offset article headings when the page title already owns h1. */
    headingOffset?: boolean;
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
export const createMarkdownComponents = (
    ogpDataMap?: Record<string, OGPData>,
    options: MarkdownComponentOptions = {}
): Partial<Components> => ({
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

    h1: ({ children, id }: HeadingComponentProps) => options.headingOffset ? (
        <h2 id={id} className="scroll-mt-24">{children}</h2>
    ) : (
        <h1 id={id} className="scroll-mt-24">{children}</h1>
    ),

    h2: ({ children, id }: HeadingComponentProps) => options.headingOffset ? (
        <h3 id={id} className="scroll-mt-24">{children}</h3>
    ) : (
        <h2 id={id} className="scroll-mt-24">{children}</h2>
    ),

    h3: ({ children, id }: HeadingComponentProps) => options.headingOffset ? (
        <h4 id={id} className="scroll-mt-24">{children}</h4>
    ) : (
        <h3 id={id} className="scroll-mt-24">{children}</h3>
    ),

    h4: ({ children, id }: HeadingComponentProps) => options.headingOffset ? (
        <h5 id={id} className="scroll-mt-24">{children}</h5>
    ) : (
        <h4 id={id} className="scroll-mt-24">{children}</h4>
    ),

    h5: ({ children, id }: HeadingComponentProps) => options.headingOffset ? (
        <h6 id={id} className="scroll-mt-24">{children}</h6>
    ) : (
        <h5 id={id} className="scroll-mt-24">{children}</h5>
    ),

    h6: ({ children, id }: HeadingComponentProps) => (
        <h6 id={id} className="scroll-mt-24">{children}</h6>
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
            <code className={`${className ?? ''} retro-inline-code`}>
                {children}
            </code>
        );
    },

    blockquote({ children }: BlockquoteComponentProps) {
        const alertType = getAlertType(children);

        if (alertType) {
            return <AlertBlock type={alertType}>{children}</AlertBlock>;
        }

        return <blockquote>{children}</blockquote>;
    },

    img: (({ src, alt, width }: ImageComponentProps) => {
        return (
            <figure className="retro-figure">
                {/* Markdown content may reference arbitrary external image hosts. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt || ''}
                    width={width}
                />
                {alt && alt !== '' && (
                    <figcaption>
                        {alt}
                    </figcaption>
                )}
            </figure>
        );
    }) as Components['img'],

    th: ({ children }: { children?: React.ReactNode }) => (
        <th>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%' }}>
                {children}
            </div>
        </th>
    ),

    table: ({ children, ...props }) => (
        <div className="table-wrapper" role="region" aria-label="横にスクロールできる表" tabIndex={0}>
            <table {...props}>{children}</table>
        </div>
    ),

    // Support for custom markdown tags (via remarkCustomDirectives hName mapping)
    message: ({ children, type }: MessageComponentProps) => {
        const typeMap: Record<string, AlertType> = {
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
