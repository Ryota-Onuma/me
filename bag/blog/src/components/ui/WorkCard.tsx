import Link from 'next/link';
import { ThemeLinks } from './ThemeLinks';
import { DateText } from './DateText';
import { ExternalLink } from './ExternalLink';

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
}

const CATEGORY_LABELS: Record<string, string> = {
    Blog: '技術記事',
    Tutorial: '解説',
    Thinking: '考察',
};

export const WorkCard = ({ title, category, description, date, updated, tags, themes, isExternal, analyticsId, href }: WorkCardProps) => {
    const titleLink = isExternal ? (
        <ExternalLink href={href} showIndicator={false} eventName={analyticsId ? 'external_article_click' : undefined} eventProperties={analyticsId ? { contentId: analyticsId } : undefined}>{title} <small>［外部］</small></ExternalLink>
    ) : (
        <Link href={href}>{title}</Link>
    );

    return (
        <li className="retro-work-card">
            <div>
                <h2>{titleLink}</h2>
                <p className="retro-card-meta">
                    公開日：<DateText value={date} />
                    {updated && updated !== date && <> ｜ 更新：<DateText value={updated} /></>}
                    {' ｜ '}分類：{CATEGORY_LABELS[category] || category}
                </p>
                {description && <p>{description}</p>}
                {!!tags?.length && <p className="retro-card-tags">タグ：{tags.filter(Boolean).join(' / ')}</p>}
                <ThemeLinks themes={themes} />
            </div>
        </li>
    );
};
