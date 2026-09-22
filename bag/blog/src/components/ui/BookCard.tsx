'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ThemeLinks } from './ThemeLinks';
import { DateText } from './DateText';

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

export const BookCard = ({ title, author, status, cover, readDate, updated, rating, tags, themes, index = 0, href }: BookCardProps) => {
    const isAboveFold = index < 3;

    return (
        <li className="retro-book-card retro-index-entry">
            <Link href={href} aria-label={`${title}の詳細`}>
              <Image
                src={cover || "/books/default_cover.png"}
                alt={`${title}の表紙`}
                width={88}
                height={120}
                loading={isAboveFold ? "eager" : "lazy"}
                {...(isAboveFold && { fetchPriority: "high" })}
              />
            </Link>
            <div className="retro-entry-body">
                <h2><Link href={href}>{title}</Link></h2>
                <p>{author} ｜ {STATUS_LABELS[status]}</p>
                <p className="retro-rating" aria-label={rating ? `5段階中${rating}` : '未評価'}>
                    評価: {rating ? `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}` : '未評価'}
                </p>
                {!!tags?.length && <p className="retro-card-tags">タグ：{tags.filter(Boolean).join(' / ')}</p>}
                <ThemeLinks themes={themes} />
            </div>
            <p className="retro-entry-date">
                <small>{updated ? '更新' : '読了'}</small>
                <DateText value={updated || readDate} />
            </p>
        </li>
    );
};
