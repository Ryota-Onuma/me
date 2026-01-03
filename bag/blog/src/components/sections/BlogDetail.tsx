import { contents, ContentItem } from '../../data/contents';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';
import { ArrowLeft, Clock, Tag, ArrowRight, Info, Lightbulb, AlertTriangle, AlertCircle, Zap } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import React from 'react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { parseMarkdownPost, ParsedPost } from '../../utils/markdown';
import { Mermaid, TableOfContents, CopyButton } from '../markdown';

// Register syntax highlighter languages
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('rust', rust);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('yml', yaml);
SyntaxHighlighter.registerLanguage('kotlin', kotlin);
SyntaxHighlighter.registerLanguage('kt', kotlin);

// Vite's way to load all markdown files in the posts directory
const posts: Record<string, string> = import.meta.glob('../../content/posts/*.md', { query: '?raw', import: 'default', eager: true });

// Types for ReactMarkdown custom components
interface CodeComponentProps {
    node?: unknown;
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

// Alert styles configuration
const ALERT_STYLES = {
    NOTE: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-200', label: 'Note' },
    TIP: { icon: Lightbulb, color: 'text-green-500', bg: 'bg-green-50/50', border: 'border-green-200', label: 'Tip' },
    IMPORTANT: { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50/50', border: 'border-purple-200', label: 'Important' },
    WARNING: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-200', label: 'Warning' },
    CAUTION: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50/50', border: 'border-red-200', label: 'Caution' },
} as const;

type AlertType = keyof typeof ALERT_STYLES;

// Helper functions for code highlighting
const shouldHighlightLine = (lineNumber: number, highlightLines: string | undefined): boolean => {
    if (!highlightLines) return false;
    const ranges = highlightLines.split(',').map(r => r.trim());
    return ranges.some(range => {
        if (range.includes('-')) {
            const [start, end] = range.split('-').map(Number);
            return lineNumber >= start && lineNumber <= end;
        }
        return Number(range) === lineNumber;
    });
};

// Helper function to extract text from React nodes
const findText = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (React.isValidElement(node) && node.props.children) {
        return findText(node.props.children);
    }
    if (Array.isArray(node)) return node.map(findText).join('');
    return '';
};

// Helper function to clean alert syntax from children
const cleanChildren = (nodes: React.ReactNode): React.ReactNode => {
    return React.Children.map(nodes, (node) => {
        if (typeof node === 'string') {
            return node.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/, '');
        }
        if (React.isValidElement(node) && node.props.children) {
            return React.cloneElement(node, {
                ...node.props,
                children: cleanChildren(node.props.children)
            });
        }
        return node;
    });
};

export const BlogDetail = (): JSX.Element => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState<ParsedPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Derived data: compute prev/next posts from slug
    const { prevPost, nextPost } = useMemo((): { prevPost: ContentItem | null; nextPost: ContentItem | null } => {
        if (!slug) return { prevPost: null, nextPost: null };
        const currentIndex = contents.findIndex(c => c.slug === slug);
        if (currentIndex === -1) return { prevPost: null, nextPost: null };
        return {
            prevPost: contents[currentIndex - 1] ?? null,
            nextPost: contents[currentIndex + 1] ?? null
        };
    }, [slug]);

    useEffect(() => {
        const loadPost = (): void => {
            setIsLoading(true);
            try {
                const path = `../../content/posts/${slug}.md`;
                const rawContent = posts[path];

                if (!rawContent) {
                    console.error('Post not found:', path);
                    setPost(null);
                    return;
                }

                const parsed = parseMarkdownPost(rawContent);
                setPost(parsed);
            } catch (err) {
                console.error('Failed to parse post:', err);
                setPost(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) loadPost();
    }, [slug]);

    // Custom ReactMarkdown components
    const markdownComponents = useMemo(() => ({
        pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
        h1: ({ children }: HeadingComponentProps) => <h1 className="scroll-mt-24">{children}</h1>,
        h2: ({ children, id }: HeadingComponentProps) => <h2 id={id} className="scroll-mt-24">{children}</h2>,
        h3: ({ children, id }: HeadingComponentProps) => <h3 id={id} className="scroll-mt-24">{children}</h3>,
        h4: ({ children, id }: HeadingComponentProps) => <h4 id={id} className="scroll-mt-24">{children}</h4>,
        code({ inline, className, children, ...props }: CodeComponentProps) {
            const match = /language-([^{:]+)(?::([^{]+))?(?:\{([^}]+)\})?/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match && match[1] === 'mermaid') {
                return <Mermaid chart={codeString} />;
            }

            if (!inline && match) {
                const language = match[1];
                const filename = match[2];
                const highlightLines = match[3];

                return (
                    <div className="relative group/code bg-[#1e1e1e] border border-white/5 rounded-xl overflow-hidden my-8 shadow-2xl transition-all duration-300">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-white/10 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{language}</span>
                                {filename && (
                                    <span className="text-xs font-bold text-white font-mono bg-accent/40 px-2.5 py-0.5 rounded border border-accent/50">{filename}</span>
                                )}
                            </div>
                            <CopyButton text={codeString} />
                        </div>
                        <SyntaxHighlighter
                            style={vscDarkPlus as Record<string, React.CSSProperties>}
                            language={language}
                            PreTag="div"
                            showLineNumbers={true}
                            lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: 'rgba(255,255,255,0.2)', textAlign: 'right', userSelect: 'none' }}
                            wrapLines={true}
                            lineProps={(lineNumber) => ({
                                style: {
                                    display: 'block',
                                    backgroundColor: shouldHighlightLine(lineNumber, highlightLines) ? 'rgba(255,255,255,0.05)' : 'transparent',
                                    borderLeft: shouldHighlightLine(lineNumber, highlightLines) ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
                                    paddingRight: '1em'
                                }
                            })}
                            className="!bg-transparent !m-0 !p-6 !pt-4 !text-sm md:!text-base"
                            {...props}
                        >
                            {codeString}
                        </SyntaxHighlighter>
                    </div>
                );
            }

            return (
                <code className={`${className} bg-black/10 px-1.5 py-0.5 rounded font-mono text-sm font-bold text-accent`} {...props}>
                    {children}
                </code>
            );
        },
        blockquote({ children }: BlockquoteComponentProps) {
            const content = findText(children).trim();
            const alertMatch = content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);

            if (alertMatch) {
                const type = alertMatch[1] as AlertType;
                const alertStyles = ALERT_STYLES[type];
                const Icon = alertStyles.icon;

                return (
                    <div className={`my-6 p-4 rounded-xl border-l-4 ${alertStyles.bg} ${alertStyles.border} transition-all duration-300`}>
                        <div className={`flex items-center gap-2 mb-2 ${alertStyles.color} font-bold uppercase tracking-widest text-[10px]`}>
                            <Icon size={14} />
                            <span>{alertStyles.label}</span>
                        </div>
                        <div className="text-black/80 prose-sm md:prose-base leading-relaxed">
                            {cleanChildren(children)}
                        </div>
                    </div>
                );
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
                {/* Immersive Hero */}
                <header className="relative w-full h-[60vh] md:h-[70vh] flex flex-col justify-end overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img
                            src={post.thumbnail || "/thumbnails/default_blog.png"}
                            alt={post.title}
                            className="w-full h-full object-cover animate-fade-in-scale"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa]/80 to-[#fafafa]/20" />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#fafafa]/20 to-transparent" />
                    </div>

                    <div className="relative z-10 px-6 md:px-24 pb-16 md:pb-24 max-w-5xl mx-auto w-full">
                        <div className="flex items-center gap-4 mb-6 flex-wrap animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <span className="flex items-center gap-2 text-xs md:text-sm text-black/80 uppercase tracking-[0.2em] font-bold">
                                <Clock size={14} className="text-black/60" />
                                {post.date}
                            </span>
                            <div className="flex gap-2 flex-wrap">
                                {post.tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1.5 text-[10px] md:text-xs bg-black/10 px-3 py-1 rounded-full text-black font-bold uppercase tracking-wider border border-black/10 backdrop-blur-md">
                                        <Tag size={10} className="text-black/60" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <h1 className="mb-0 text-black animate-fade-in-up md:text-6xl lg:text-7xl" style={{ animationDelay: '300ms' }}>
                            {post.title}
                        </h1>
                    </div>
                </header>

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

                    {/* Navigation */}
                    <div className="max-w-3xl mx-auto mt-20 pt-10 border-t border-black/10 flex flex-col md:flex-row justify-between gap-6">
                        {prevPost ? (
                            <button
                                onClick={() => {
                                    if (prevPost.type === 'internal' && prevPost.slug) {
                                        navigate(`/blog/${prevPost.slug}`);
                                    } else if (prevPost.url) {
                                        window.open(prevPost.url, '_blank', 'noopener,noreferrer');
                                    }
                                }}
                                className="group flex flex-col items-start gap-2 text-left w-full md:w-1/2 p-4 rounded-2xl hover:bg-black/5 transition-all border border-transparent hover:border-black/5 cursor-pointer"
                            >
                                <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-black/40 group-hover:text-black/60 transition-colors">
                                    <ArrowLeft size={12} /> Previous
                                </span>
                                <span className="text-lg font-bold text-black group-hover:text-black/90 line-clamp-2">
                                    {prevPost.title}
                                </span>
                            </button>
                        ) : <div className="w-full md:w-1/2" />}

                        {nextPost && (
                            <button
                                onClick={() => {
                                    if (nextPost.type === 'internal' && nextPost.slug) {
                                        navigate(`/blog/${nextPost.slug}`);
                                    } else if (nextPost.url) {
                                        window.open(nextPost.url, '_blank', 'noopener,noreferrer');
                                    }
                                }}
                                className="group flex flex-col items-end gap-2 text-right w-full md:w-1/2 p-4 rounded-2xl hover:bg-black/5 transition-all border border-transparent hover:border-black/5 cursor-pointer"
                            >
                                <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-black/40 group-hover:text-black/60 transition-colors">
                                    Next <ArrowRight size={12} />
                                </span>
                                <span className="text-lg font-bold text-black group-hover:text-black/90 line-clamp-2">
                                    {nextPost.title}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
