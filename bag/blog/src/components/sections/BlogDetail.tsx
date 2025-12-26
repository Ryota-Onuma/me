import { contents, ContentItem } from '../../data/contents';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import { ArrowLeft, Clock, Tag, Copy, Check, ArrowRight } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Header, Footer } from '../layout';
import { useHasScrolled } from '../../hooks/useHasScrolled';
import { parseMarkdownPost, ParsedPost } from '../../utils/markdown';

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

// Vite's way to load all markdown files in the posts directory
const posts: Record<string, string> = import.meta.glob('../../content/posts/*.md', { query: '?raw', import: 'default', eager: true });

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all duration-300 z-10 opacity-0 group-hover/code:opacity-100"
            title="Copy code"
        >
            {copied ? (
                <Check size={14} className="text-green-400" />
            ) : (
                <Copy size={14} />
            )}
        </button>
    );
};

export const BlogDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState<ParsedPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isScrolled } = useHasScrolled();

    // Derived data: compute prev/next posts from slug (no useEffect needed)
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
        const loadPost = () => {
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
        window.scrollTo(0, 0);
    }, [slug]);

    if (isLoading) {
        return <div className="min-h-screen bg-[#050505]" />;
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white/50 gap-6">
                <p className="text-xl font-bold tracking-widest uppercase">Post Not Found</p>
                <button
                    onClick={() => navigate('/')}
                    className="text-xs uppercase tracking-widest font-black border-b border-white/20 pb-1 hover:border-white transition-colors"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-[#f0f0f0]">
            <Header
                isScrolled={isScrolled}
                activeSection=""
                navLinks={['home', 'about', 'blog']}
                onMobileMenuOpen={() => { }}
                backLink="/blog"
                backLabel="Back to Blog"
            />

            <main className="min-h-screen animate-fade-in relative z-10">
                {/* Immersive Hero */}
                <header className="relative w-full h-[60vh] md:h-[70vh] flex flex-col justify-end overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img
                            src={post.thumbnail || "/thumbnails/default_blog.png"}
                            alt={post.title}
                            className="w-full h-full object-cover scale-105 animate-width-expand opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/30 to-transparent" />
                    </div>

                    <div className="relative z-10 px-6 md:px-24 pb-16 md:pb-24 max-w-5xl mx-auto w-full">

                        <div className="flex items-center gap-4 mb-6 flex-wrap animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <span className="flex items-center gap-2 text-xs md:text-sm text-white/80 uppercase tracking-[0.2em] font-bold">
                                <Clock size={14} className="text-white/60" />
                                {post.date}
                            </span>
                            <div className="flex gap-2 flex-wrap">
                                {post.tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1.5 text-[10px] md:text-xs bg-white/10 px-3 py-1 rounded-full text-white font-bold uppercase tracking-wider border border-white/10 backdrop-blur-md">
                                        <Tag size={10} className="text-white/60" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <h1 className="mb-0 text-white animate-fade-in-up md:text-6xl lg:text-7xl" style={{ animationDelay: '300ms' }}>
                            {post.title}
                        </h1>
                    </div>
                </header>

                <div className="px-6 md:px-24 pb-24">
                    <div className="max-w-3xl mx-auto prose prose-invert prose-lg md:prose-xl prose-headings:font-bold prose-headings:tracking-tight prose-a:text-white prose-a:decoration-white/30 hover:prose-a:decoration-white prose-code:text-white prose-img:rounded-2xl prose-img:border prose-img:border-white/10">
                        <ReactMarkdown
                            components={{
                                pre: ({ children }: any) => <>{children}</>,
                                code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const codeString = String(children).replace(/\n$/, '');

                                    return !inline && match ? (
                                        <div className="relative group/code bg-white/5 border border-white/10 rounded-xl overflow-hidden my-8">
                                            <CopyButton text={codeString} />
                                            <SyntaxHighlighter
                                                style={atomDark as any}
                                                language={match[1]}
                                                PreTag="div"
                                                className="!bg-transparent !m-0 !p-6"
                                                {...props}
                                            >
                                                {codeString}
                                            </SyntaxHighlighter>
                                        </div>
                                    ) : (
                                        <code className={`${className} bg-white/10 px-1.5 py-0.5 rounded font-mono text-sm`} {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                            }}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </div>

                    {/* Navigation */}
                    {/* Navigation */}
                    {/* Navigation */}
                    <div className="max-w-3xl mx-auto mt-20 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between gap-6">
                        {prevPost ? (
                            <button
                                onClick={() => {
                                    if (prevPost.type === 'internal' && prevPost.slug) {
                                        navigate(`/blog/${prevPost.slug}`);
                                    } else if (prevPost.url) {
                                        window.open(prevPost.url, '_blank', 'noopener,noreferrer');
                                    }
                                }}
                                className="group flex flex-col items-start gap-2 text-left w-full md:w-1/2 p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 cursor-pointer"
                            >
                                <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                                    <ArrowLeft size={12} /> Previous
                                </span>
                                <span className="text-lg font-bold text-white group-hover:text-white/90 line-clamp-2">
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
                                className="group flex flex-col items-end gap-2 text-right w-full md:w-1/2 p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 cursor-pointer"
                            >
                                <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                                    Next <ArrowRight size={12} />
                                </span>
                                <span className="text-lg font-bold text-white group-hover:text-white/90 line-clamp-2">
                                    {nextPost.title}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};
