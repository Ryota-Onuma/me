'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ThemeLinks } from './ThemeLinks';
import { DateText } from './DateText';
import { ExternalLink } from './ExternalLink';

interface BookCardProps {
    title: string;
    author: string;
    status: 'yet' | 'reading' | 'completed';
    cover?: string;
    readDate?: string;
    updated?: string;
    rating?: number;
    tags?: string[];
    themes?: string[];
    hasNotes?: boolean;
    index?: number; // For LCP optimization
    analyticsId?: string;
    href: string;
}

const STATUS_LABELS: Record<'yet' | 'reading' | 'completed', string> = {
    yet: '未読',
    reading: '読書中',
    completed: '読了',
};

export const BookCard = ({ title, author, status, cover, readDate, updated, rating, tags, themes, hasNotes = true, index = 0, analyticsId, href }: BookCardProps) => {
    const isAboveFold = index < 3;

    return (
        <li className="retro-book-card">
            <Image
                src={cover || "/books/default_cover.png"}
                alt=""
                width={116}
                height={156}
                loading={isAboveFold ? "eager" : "lazy"}
                {...(isAboveFold && { fetchPriority: "high" })}
            />
            <div>
                <h2>{hasNotes ? <Link href={href}>{title}</Link> : <ExternalLink href={href} showIndicator={false} eventName={analyticsId ? 'external_article_click' : undefined} eventProperties={analyticsId ? { contentId: analyticsId } : undefined}>{title} <small>［書籍情報］</small></ExternalLink>}</h2>
                <p className="retro-card-meta">
                    {STATUS_LABELS[status]}
                    {readDate && <> ｜ 読了：<DateText value={readDate} /></>}
                    {updated && updated !== readDate && <> ｜ 更新：<DateText value={updated} /></>}
                </p>
                <p>著者：{author}</p>
                <p className="retro-rating" aria-label={rating ? `5段階中${rating}` : '未評価'}>
                    評価: {rating ? `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}` : '未評価'}
                </p>
                {!!tags?.length && <p className="retro-card-tags">タグ：{tags.filter(Boolean).join(' / ')}</p>}
                <ThemeLinks themes={themes} />
            </div>
        </li>
    );
};
