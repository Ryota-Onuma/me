'use client';

import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { useMemo, useState } from 'react';
import React from 'react';

import remarkDirective from 'remark-directive';
import remarkGemoji from 'remark-gemoji';
import { remarkCustomDirectives } from '@/lib/remark-custom-directives';

import { Header, Footer, MobileMenu } from '@/components/layout';
import { NoiseOverlay, Spotlight } from '@/components/effects';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useHasScrolled } from '@/hooks/useHasScrolled';

import {
    Mermaid, TableOfContents, AlertBlock, CodeBlock, getAlertType,
    DetailsBlock, EmbedBlock, LinkCardClient
} from '@/components/markdown';
import { BlogHero, BlogNavigation } from '@/components/sections';
import type { ContentItem } from '@/lib/posts';

const NAV_LINKS = ['about', 'blog'];

interface ParsedPost {
    title: string;
    date: string;
    tags: string[];
    content: string;
    thumbnail?: string;
}

interface BlogDetailClientProps {
    post: ParsedPost;
    prevPost: ContentItem | null;
    nextPost: ContentItem | null;
}

// Types for ReactMarkdown custom components
interface CodeComponentProps {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}

interface HeadingComponentProps {
    children?: React.ReactNode;
    id?: string;
}

interface BlockquoteComponentProps {
    children?: React.ReactNode;
}

export function BlogDetailClient({ post, prevPost, nextPost }: BlogDetailClientProps) {
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollProgress } = useScrollProgress();
    const { isScrolled } = useHasScrolled();

    // Custom ReactMarkdown components
    const markdownComponents = useMemo(() => ({
        // Override p to handle block elements (prevents hydration errors)
        p: ({ children }: { children?: React.ReactNode }) => {
            // Check if children contain block elements (figure, div, img, etc.)
            // img is included because our custom img component returns <figure>
            const hasBlockChild = React.Children.toArray(children).some(
                (child) => React.isValidElement(child) &&
                    ['figure', 'div', 'img', 'youtube', 'twitter', 'github', 'link-card'].includes(
                        typeof child.type === 'string' ? child.type : (child.type as any)?.name || ''
                    )
            );
            if (hasBlockChild) {
                return <>{children}</>;
            }
            return <p>{children}</p>;
        },
        pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
        h1: ({ children }: HeadingComponentProps) => <h1 className="scroll-mt-24">{children}</h1>,
        h2: ({ children, id }: HeadingComponentProps) => <h2 id={id} className="scroll-mt-24">{children}</h2>,
        h3: ({ children, id }: HeadingComponentProps) => <h3 id={id} className="scroll-mt-24">{children}</h3>,
        h4: ({ children, id }: HeadingComponentProps) => <h4 id={id} className="scroll-mt-24">{children}</h4>,
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
                <code className={`${className} bg-black/10 px-1.5 py-0.5 rounded font-mono text-sm font-bold text-accent`}>
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
        img({ src, alt, width }: any) {
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
        },
        // Support for custom markdown tags (via remarkCustomDirectives hName mapping)
        message: ({ children, type }: any) => {
            const alertType = type === 'alert' ? 'WARNING' : 'NOTE';
            return <AlertBlock type={alertType as any}>{children}</AlertBlock>;
        },
        details: ({ children, title }: any) => {
            return <DetailsBlock title={title}>{children}</DetailsBlock>;
        },
        youtube: ({ id }: any) => <EmbedBlock type="youtube" id={id} />,
        twitter: ({ id }: any) => <EmbedBlock type="twitter" id={id} />,
        github: ({ id }: any) => <EmbedBlock type="github" id={id} />,
        gist: ({ id }: any) => <EmbedBlock type="gist" id={id} />,
        codepen: ({ id }: any) => <EmbedBlock type="codepen" id={id} />,
        slideshare: ({ id }: any) => <EmbedBlock type="slideshare" id={id} />,
        speakerdeck: ({ id }: any) => <EmbedBlock type="speakerdeck" id={id} />,
        docswell: ({ id }: any) => <EmbedBlock type="docswell" id={id} />,
        jsfiddle: ({ id }: any) => <EmbedBlock type="jsfiddle" id={id} />,
        codesandbox: ({ id }: any) => <EmbedBlock type="codesandbox" id={id} />,
        stackblitz: ({ id }: any) => <EmbedBlock type="stackblitz" id={id} />,
        figma: ({ id }: any) => <EmbedBlock type="figma" id={id} />,
        'link-card': ({ url }: any) => <LinkCardClient url={url} />
    }), []);

    if (!post) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center text-black/50 gap-6">
                <p className="text-xl font-bold tracking-widest uppercase">Post Not Found</p>
                <button
                    onClick={() => router.push('/')}
                    className="text-xs uppercase tracking-widest font-black border-b border-black/20 pb-1 hover:border-black transition-colors"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <>
            <NoiseOverlay />
            <Spotlight />

            <ProgressBar scrollProgress={scrollProgress} />

            <Header
                isScrolled={isScrolled}
                navLinks={NAV_LINKS}
                onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
                backLink="/blog"
                backLabel="Blog"
            />

            <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">
                <main className="min-h-screen animate-fade-in relative z-10">
                    <BlogHero post={post} />

                    <div className="px-6 md:px-24 pb-24">
                        <div className="max-w-3xl mx-auto">
                            <TableOfContents content={post.content} />

                            <div className="prose prose-lg md:prose-xl prose-headings:font-bold prose-headings:tracking-tight prose-a:text-black prose-a:decoration-black/30 hover:prose-a:decoration-black prose-code:text-black prose-code:before:content-none prose-code:after:content-none prose-img:rounded-2xl prose-img:border prose-img:border-black/10 prose-blockquote:border-none prose-blockquote:p-0 prose-light">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkGemoji, remarkCustomDirectives]}
                                    rehypePlugins={[rehypeKatex, rehypeSlug, rehypeRaw]}
                                    components={markdownComponents as any}
                                >
                                    {post.content}
                                </ReactMarkdown>
                            </div>
                        </div>

                        <BlogNavigation prevPost={prevPost} nextPost={nextPost} />
                    </div>
                </main>
            </div>

            <Footer />

            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                navLinks={NAV_LINKS}
            />
        </>
    );
}
