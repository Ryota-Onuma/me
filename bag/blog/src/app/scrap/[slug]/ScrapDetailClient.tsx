import Link from 'next/link';
import type { OGPData } from '@/lib/prefetchOGP';

import { Header, Footer } from '@/components/layout';
import { MarkdownContent } from '@/components/markdown/MarkdownContent';
import { TableOfContents } from '@/components/markdown/TableOfContents';
import { RelatedContentSection } from '@/components/sections/RelatedContentSection';
import { ThemeLinks } from '@/components/ui/ThemeLinks';

import type { Scrap } from '@/lib/scraps';




interface ScrapDetailClientProps {
    scrap: Scrap;
    accession: string;
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

export function ScrapDetailClient({ scrap, accession, ogpDataMap, relatedContent = [] }: ScrapDetailClientProps) {
    return (
        <div className="site-shell">
            <Header backLink="/scrap" backLabel="雑記帳一覧へ" activePath="/scrap" />
            <main id="main-content" className="retro-detail-page" tabIndex={-1}>
                <header className="retro-scrap-hero">
                    <div>
                        <div className="retro-record-stamp">
                            <span>資料票</span>
                            <b>{accession}</b>
                        </div>
                        <p className="retro-kicker">SCRAP NOTE / WORK IN PROGRESS</p>
                        <h1><span className="retro-scrap-emoji" aria-hidden="true">{scrap.frontmatter.emoji}</span>{' '}{scrap.frontmatter.title}</h1>
                        <p className="retro-card-meta">
                            作成日：{scrap.frontmatter.date}{scrap.updatedAt && scrap.updatedAt !== scrap.frontmatter.date && ` ｜ 更新日：${scrap.updatedAt}`} ｜ 状態：{STATUS_LABELS[scrap.frontmatter.status]}
                            {scrap.isThreaded && ` ｜ 追記 ${scrap.threads.length} 件`}
                            {scrap.frontmatter.tags.length > 0 && ` ｜ 分類：${scrap.frontmatter.tags.join(' / ')}`}
                        </p>
                        <ThemeLinks themes={scrap.frontmatter.themes} />
                    </div>
                </header>

                <div className={`retro-thread-list${scrap.isThreaded ? '' : ' retro-article-wrap'}`}>
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
                                <MarkdownContent content={thread.content} headingOffset ogpDataMap={ogpDataMap} />
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
