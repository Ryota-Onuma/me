import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Tag, Copy, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PostData {
    title: string;
    date: string;
    tags: string[];
    content: string;
    thumbnail?: string;
}

// Vite's way to load all markdown files in the posts directory
const posts = import.meta.glob('../../content/posts/*.md', { as: 'raw', eager: true });

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
            <AnimatePresence mode="wait">
                {copied ? (
                    <motion.div
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                    >
                        <Check size={14} className="text-green-400" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="copy"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                    >
                        <Copy size={14} />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
};

export const BlogDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState<PostData | null>(null);

    useEffect(() => {
        const loadPost = () => {
            try {
                const path = `../../content/posts/${slug}.md`;
                const rawContent = posts[path];

                if (!rawContent) {
                    console.error('Post not found:', path);
                    return;
                }

                // Simple manual frontmatter parser
                const match = rawContent.match(/^---([\s\S]*?)---([\s\S]*)$/);
                if (match) {
                    const frontmatter = match[1];
                    const content = match[2];

                    const data: any = {};
                    frontmatter.split('\n').forEach(line => {
                        const [key, ...valueParts] = line.split(':');
                        if (key && valueParts.length > 0) {
                            const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
                            if (key.trim() === 'tags') {
                                data.tags = value.replace(/[\[\]]/g, '').split(',').map(t => t.trim());
                            } else {
                                data[key.trim()] = value;
                            }
                        }
                    });

                    setPost({
                        title: data.title || 'Untitled',
                        date: data.date || '',
                        tags: data.tags || [],
                        thumbnail: data.thumbnail,
                        content: content
                    });
                }
            } catch (err) {
                console.error('Failed to parse post:', err);
            }
        };

        if (slug) loadPost();
        window.scrollTo(0, 0);
    }, [slug]);

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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[#050505] text-[#f0f0f0] pt-32 pb-64 px-6 md:px-24"
        >
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="group flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-12 cursor-pointer"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs uppercase tracking-widest font-bold">Back to Home</span>
                </button>

                <header className="mb-16">
                    <div className="relative aspect-video w-full mb-12 rounded-2xl overflow-hidden border border-white/10 group/thumb">
                        <img
                            src={post.thumbnail || "/thumbnails/default_blog.png"}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60" />
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <span className="flex items-center gap-1.5 text-[11px] text-white/70 uppercase tracking-[0.25em] font-black italic">
                            <Clock size={12} className="text-white/40" />
                            {post.date}
                        </span>
                        <div className="flex gap-2.5">
                            {post.tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1.5 text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-white font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer border border-white/5 hover:border-white/20">
                                    <Tag size={10} className="text-white/60" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-[1.05] uppercase italic">
                        {post.title}
                    </h1>
                </header>

                <div className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-white prose-code:text-white">
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
            </div>
        </motion.div>
    );
};
