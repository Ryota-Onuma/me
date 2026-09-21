'use client';

import Link from 'next/link';
import { ThemeLinks } from './ThemeLinks';
import { DateText } from './DateText';
import { ARCHIVE_SECTIONS, formatAccessionNumber } from '@/data/site';

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
        <li className="retro-scrap-card retro-index-entry" data-index={index + 1}>
            <p className="retro-accession">{formatAccessionNumber(ARCHIVE_SECTIONS.scrap.accessionPrefix, index)}</p>
            <p className="retro-entry-type">{STATUS_LABELS[status]}</p>
            <div className="retro-entry-body">
                <h2><span className="retro-scrap-emoji" aria-hidden="true">{emoji}</span>{' '}<Link href={href}>{title}</Link></h2>
                <p className="retro-card-meta">
                    {isThreaded ? `追記 ${threadCount} 件` : '単独メモ'}
                </p>
                {tags.length > 0 && <p className="retro-card-tags">タグ：{tags.join(' / ')}</p>}
                <ThemeLinks themes={themes} />
            </div>
            <p className="retro-entry-date">
                <small>更新</small>
                <DateText value={lastUpdated || date} />
                {lastUpdated && lastUpdated !== date && <span>作成 <DateText value={date} /></span>}
            </p>
        </li>
    );
};
