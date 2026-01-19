'use client';

import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { useState, useMemo } from 'react';

import remarkDirective from 'remark-directive';
import remarkGemoji from 'remark-gemoji';
import { remarkCustomDirectives } from '@/lib/remarkCustomDirectives';
import { createMarkdownComponents } from '@/lib/markdownComponents';
import type { OGPData } from '@/lib/prefetchOGP';

import { Header, Footer, MobileMenu } from '@/components/layout';
import { NoiseOverlay, Spotlight } from '@/components/effects';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useHasScrolled } from '@/hooks/useHasScrolled';

import { TableOfContents } from '@/components/markdown';
import { BlogHero, BlogNavigation } from '@/components/sections';
import type { ContentItem } from '@/lib/posts';
import { NAV_LINKS } from '@/constants/navigation';

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
    ogpDataMap?: Record<string, OGPData>;
}

export function BlogDetailClient({ post, prevPost, nextPost, ogpDataMap }: BlogDetailClientProps) {
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollProgress } = useScrollProgress();
    const { isScrolled } = useHasScrolled();

    // Memoize markdown components to prevent re-mounting on scroll
    const markdownComponents = useMemo(
        () => createMarkdownComponents(ogpDataMap),
        [ogpDataMap]
    );

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

            <Footer />

            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                navLinks={NAV_LINKS}
            />
        </>
    );
}
