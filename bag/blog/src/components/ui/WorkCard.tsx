import Link from 'next/link';
import { ThemeLinks } from './ThemeLinks';
import { DateText } from './DateText';
import { ExternalLink } from './ExternalLink';
import { ARCHIVE_SECTIONS, formatAccessionNumber } from '@/data/site';

interface WorkCardProps {
    title: string;
    category: string;
    description?: string;
    date?: string;
    updated?: string;
    tags?: string[];
    themes?: string[];
    isExternal?: boolean;
    analyticsId?: string;
    href: string;
    index?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
    Blog: '技術記事',
    Tutorial: '解説',
    Thinking: '考察',
};

export const WorkCard = ({ title, category, description, date, updated, tags, themes, isExternal, analyticsId, href, index = 0 }: WorkCardProps) => {
    const titleLink = isExternal ? (
        <ExternalLink href={href} showIndicator={false} eventName={analyticsId ? 'external_article_click' : undefined} eventProperties={analyticsId ? { contentId: analyticsId } : undefined}>{title} <small>［外部］</small></ExternalLink>
    ) : (
        <Link href={href}>{title}</Link>
    );

    return (
        <li className="retro-work-card retro-index-entry">
            <p className="retro-accession">{formatAccessionNumber(ARCHIVE_SECTIONS.blog.accessionPrefix, index)}</p>
            <p className="retro-entry-type">{isExternal ? '外部資料' : CATEGORY_LABELS[category] || category}</p>
            <div className="retro-entry-body">
                <h2>{titleLink}</h2>
                {description && <p>{description}</p>}
                {!!tags?.length && <p className="retro-card-tags">タグ：{tags.filter(Boolean).join(' / ')}</p>}
                <ThemeLinks themes={themes} />
            </div>
            <p className="retro-entry-date">
                <small>更新</small>
                <DateText value={updated || date} />
                {updated && updated !== date && <span>初出 <DateText value={date} /></span>}
            </p>
        </li>
    );
};
