'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';

import remarkDirective from 'remark-directive';
import remarkGemoji from 'remark-gemoji';
import { remarkCustomDirectives } from '@/lib/remarkCustomDirectives';
import { createMarkdownComponents } from '@/lib/markdownComponents';
import type { OGPData } from '@/lib/prefetchOGP';

import { Header, Footer } from '@/components/layout';
import { TableOfContents } from '@/components/markdown';
import { BlogHero, BlogNavigation, RelatedContentSection } from '@/components/sections';
import type { ContentItem } from '@/lib/posts';




interface ParsedPost {
    title: string;
    date: string;
    tags: string[];
    content: string;
    thumbnail?: string;
    themes?: string[];
    updated?: string;
}

interface BlogDetailClientProps {
    post: ParsedPost;
    prevPost: ContentItem | null;
    nextPost: ContentItem | null;
    ogpDataMap?: Record<string, OGPData>;
    relatedContent?: import('@/lib/content').UnifiedContent[];
}

export function BlogDetailClient({ post, prevPost, nextPost, ogpDataMap, relatedContent = [] }: BlogDetailClientProps) {
    const markdownComponents = useMemo(
        () => createMarkdownComponents(ogpDataMap),
        [ogpDataMap]
    );

    return (
        <div className="site-shell">
            <Header backLink="/blog" backLabel="技術ノート一覧へ" activePath="/blog" />
            <main id="main-content" className="retro-detail-page" tabIndex={-1}>
                <BlogHero post={post} />
                <div className="retro-article-wrap">
                    <TableOfContents content={post.content} />
                    <article className="retro-article">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkGemoji, remarkCustomDirectives]}
                            rehypePlugins={[rehypeKatex, rehypeSlug, rehypeRaw]}
                            components={markdownComponents}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </article>
                    <BlogNavigation prevPost={prevPost} nextPost={nextPost} />
                    <RelatedContentSection contents={relatedContent} />
                </div>
            </main>
            <Footer />
        </div>
    );
}
