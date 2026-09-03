import Image from 'next/image';
import type { OGPData } from '@/lib/prefetchOGP';

import { Header, Footer } from '@/components/layout';
import { MarkdownContent } from '@/components/markdown/MarkdownContent';
import { RelatedContentSection } from '@/components/sections/RelatedContentSection';
import { ThemeLinks } from '@/components/ui/ThemeLinks';
import { isMediaTag } from '@/lib/themes';
import { ExternalLink } from '@/components/ui/ExternalLink';
interface ParsedBook {
    title: string;
    author: string;
    status: 'yet' | 'reading' | 'completed';
    externalUrl: string;
    tags: string[];
    cover?: string;
    readDate?: string;
    rating?: number;
    themes?: string[];
    updated?: string;
    content: string;
    externalLabel?: string;
}

interface BookDetailClientProps {
    book: ParsedBook;
    ogpDataMap?: Record<string, OGPData>;
    relatedContent?: import('@/lib/content').UnifiedContent[];
}

const STATUS_LABELS: Record<'yet' | 'reading' | 'completed', string> = {
    yet: '未読',
    reading: '読書中',
    completed: '読了',
};

export function BookDetailClient({ book, ogpDataMap, relatedContent = [] }: BookDetailClientProps) {
    return (
        <div className="site-shell">
            <Header backLink="/library" backLabel="読書記録一覧へ" activePath="/library" />
            <main id="main-content" className="retro-detail-page" tabIndex={-1}>
                <section className="retro-book-hero">
                    {book.cover && <Image src={book.cover} alt={`${book.title}の表紙`} width={280} height={400} priority />}
                    <div>
                        <p className="retro-card-meta">読書状況：{STATUS_LABELS[book.status]}{book.updated && ` ｜ 記録日：${book.updated}`}</p>
                        <h1>{book.title}</h1>
                        <p className="retro-book-author">著者：{book.author}</p>
                        <table>
                            <tbody>
                                <tr><th scope="row">読書状況</th><td>{STATUS_LABELS[book.status]}</td></tr>
                                <tr><th scope="row">読了日</th><td>{book.readDate || '未登録'}</td></tr>
                                <tr><th scope="row">評価</th><td className="retro-rating">{book.rating ? `${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)} (${book.rating}/5)` : '未評価'}</td></tr>
                                <tr><th scope="row">タグ</th><td className="retro-card-tags">{book.tags.filter(tag => !isMediaTag(tag)).join(' / ') || '未登録'}</td></tr>
                            </tbody>
                        </table>
                        <ThemeLinks themes={book.themes} />
                        <p><ExternalLink href={book.externalUrl} eventName="external_article_click" eventProperties={{ contentType: 'library' }}>≫ {book.externalLabel || '書籍の詳細を外部サイトで見る'}</ExternalLink></p>
                    </div>
                </section>

                <article className="retro-article retro-book-notes">
                    <h2>読書メモ</h2>
                    {book.content.trim() ? (
                        <MarkdownContent content={book.content} ogpDataMap={ogpDataMap} />
                    ) : (
                        <p className="retro-card-meta">この本のメモはまだありません。</p>
                    )}
                </article>
                <RelatedContentSection contents={relatedContent} />
            </main>
            <Footer />
        </div>
    );
}
