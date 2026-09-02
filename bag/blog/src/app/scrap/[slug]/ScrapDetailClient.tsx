'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';
import Link from 'next/link';

import remarkDirective from 'remark-directive';
import remarkGemoji from 'remark-gemoji';
import { remarkCustomDirectives } from '@/lib/remarkCustomDirectives';
import { createMarkdownComponents } from '@/lib/markdownComponents';
import type { OGPData } from '@/lib/prefetchOGP';

import { Header, Footer } from '@/components/layout';
import { TableOfContents } from '@/components/markdown';
import { RelatedContentSection } from '@/components/sections';
import { ThemeLinks } from '@/components/ui/ThemeLinks';

import type { Scrap } from '@/lib/scraps';




interface ScrapDetailClientProps {
    scrap: Scrap;
    ogpDataMap?: Record<string, OGPData>;
    relatedContent?: import('@/lib/content').UnifiedContent[];
}

const STATUS_LABELS: Record<Scrap['frontmatter']['status'], string> = {
    open: '公開中',
    closed: '完了',
    growing: '育成中',
    evergreen: '定番',
    archived: '更新終了',
    published: 'Blog整理済み',
};

export function ScrapDetailClient({ scrap, ogpDataMap, relatedContent = [] }: ScrapDetailClientProps) {
    const markdownComponents = useMemo(
        () => createMarkdownComponents(ogpDataMap, { headingOffset: true }),
        [ogpDataMap]
    );

    return (
        <div className="site-shell">
            <Header backLink="/scrap" backLabel="雑記帳一覧へ" activePath="/scrap" />
            <main id="main-content" className="retro-detail-page" tabIndex={-1}>
                <header className="retro-scrap-hero">
                    <div>
                        <h1><span className="retro-scrap-emoji" aria-hidden="true">{scrap.frontmatter.emoji}</span>{' '}{scrap.frontmatter.title}</h1>
                        <p className="retro-card-meta">
                            作成日：{scrap.frontmatter.date}{scrap.updatedAt && scrap.updatedAt !== scrap.frontmatter.date && ` ｜ 更新日：${scrap.updatedAt}`} ｜ 状態：{STATUS_LABELS[scrap.frontmatter.status]}
                            {scrap.isThreaded && ` ｜ 追記 ${scrap.threads.length} 件`}
                            {scrap.frontmatter.tags.length > 0 && ` ｜ 分類：${scrap.frontmatter.tags.join(' / ')}`}
                        </p>
                        <ThemeLinks themes={scrap.frontmatter.themes} />
                    </div>
                </header>

                <div className="retro-thread-list">
                    {!scrap.isThreaded && <TableOfContents content={scrap.rawContent} />}
                    {scrap.threads.map((thread, index) => (
                        <article key={thread.id} className={`retro-thread${scrap.isThreaded ? '' : ' retro-thread-single'}`}>
                            {scrap.isThreaded && (
                                <header>
                                    <b>No.{String(index + 1).padStart(2, '0')}</b>
                                    {thread.timestamp && <span>{thread.timestamp}</span>}
                                </header>
                            )}
                            <div className="retro-article">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkGemoji, remarkCustomDirectives]}
                                    rehypePlugins={[rehypeKatex, rehypeSlug, rehypeRaw]}
                                    components={markdownComponents}
                                >
                                    {thread.content}
                                </ReactMarkdown>
                            </div>
                        </article>
                    ))}
                    <p className="retro-end-links"><a href="#main-content">↑ ページ先頭へ</a> ｜ <Link href="/scrap">雑記帳一覧へ</Link></p>
                    <RelatedContentSection contents={relatedContent} />
                </div>
            </main>
            <Footer />
        </div>
    );
}
