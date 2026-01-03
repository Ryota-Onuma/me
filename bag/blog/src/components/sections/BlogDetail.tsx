import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';
import React from 'react';

import { useBlogPost } from '../../hooks/useBlogPost';
import { Mermaid, TableOfContents, AlertBlock, CodeBlock, getAlertType } from '../markdown';
import { BlogHero, BlogNavigation } from './index';

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

export const BlogDetail = (): JSX.Element => {
    const navigate = useNavigate();
    const { post, isLoading, prevPost, nextPost } = useBlogPost();

    // Custom ReactMarkdown components
    const markdownComponents = useMemo(() => ({
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
        }
    }), []);

    if (isLoading) {
        return <div className="min-h-screen bg-[#fafafa]" />;
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center text-black/50 gap-6">
                <p className="text-xl font-bold tracking-widest uppercase">Post Not Found</p>
                <button
                    onClick={() => navigate('/')}
                    className="text-xs uppercase tracking-widest font-black border-b border-black/20 pb-1 hover:border-black transition-colors"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">
            <main className="min-h-screen animate-fade-in relative z-10">
                <BlogHero post={post} />

                <div className="px-6 md:px-24 pb-24">
                    <div className="max-w-3xl mx-auto">
                        <TableOfContents content={post.content} />

                        <div className="prose prose-lg md:prose-xl prose-headings:font-bold prose-headings:tracking-tight prose-a:text-black prose-a:decoration-black/30 hover:prose-a:decoration-black prose-code:text-black prose-code:before:content-none prose-code:after:content-none prose-img:rounded-2xl prose-img:border prose-img:border-black/10 prose-blockquote:border-none prose-blockquote:p-0">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex, rehypeSlug, rehypeRaw]}
                                components={markdownComponents}
                            >
                                {post.content}
                            </ReactMarkdown>
                        </div>
                    </div>

                    <BlogNavigation prevPost={prevPost} nextPost={nextPost} />
                </div>
            </main>
        </div>
    );
};
