'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ThemeLinks } from './ThemeLinks';

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
    href: string;
}

const STATUS_LABELS: Record<'yet' | 'reading' | 'completed', string> = {
    yet: '未読',
    reading: '読書中',
    completed: '読了',
};

export const BookCard = ({ title, author, status, cover, readDate, updated, rating, tags, themes, hasNotes = true, index = 0, href }: BookCardProps) => {
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
                <h2>{hasNotes ? <Link href={href}>{title}</Link> : <a href={href} target="_blank" rel="noopener noreferrer">{title} <small>［書籍情報］</small></a>}</h2>
                <p className="retro-card-meta">{STATUS_LABELS[status]}{readDate ? ` ｜ 読了：${readDate}` : ''}{updated && updated !== readDate ? ` ｜ 更新：${updated}` : ''}</p>
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
