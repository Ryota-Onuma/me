'use client';

import Link from 'next/link';
import { ThemeLinks } from './ThemeLinks';
import { DateText } from './DateText';

interface ScrapCardProps {
    title: string;
    emoji: string;
    status: 'open' | 'closed' | 'growing' | 'evergreen' | 'archived' | 'published';
    date: string;
    lastUpdated?: string;
    tags: string[];
    themes?: string[];
    threadCount: number;
    isThreaded: boolean;
    index: number;
    href: string;
}

const STATUS_LABELS = {
    open: '公開中',
    closed: '完了',
    growing: '育成中',
    evergreen: '定番',
    archived: '更新終了',
    published: 'Blog整理済み',
} as const;

export const ScrapCard = ({ title, emoji, status, date, lastUpdated, tags, themes, threadCount, isThreaded, index, href }: ScrapCardProps) => {
    return (
        <li className="retro-scrap-card" data-index={index + 1}>
            <div>
                <h2><span className="retro-scrap-emoji" aria-hidden="true">{emoji}</span>{' '}<Link href={href}>{title}</Link></h2>
                <p className="retro-card-meta">
                    作成：<DateText value={date} />
                    {lastUpdated && lastUpdated !== date && <> ｜ 更新：<DateText value={lastUpdated} /></>}
                    {' ｜ '}{STATUS_LABELS[status]}{isThreaded ? ` ｜ 追記 ${threadCount} 件` : ''}
                </p>
                {tags.length > 0 && <p className="retro-card-tags">タグ：{tags.join(' / ')}</p>}
                <ThemeLinks themes={themes} />
            </div>
        </li>
    );
};
