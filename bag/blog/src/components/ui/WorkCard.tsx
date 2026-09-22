import Image from 'next/image';
import Link from 'next/link';
import { ThemeLinks } from './ThemeLinks';
import { DateText } from './DateText';
import { ExternalLink } from './ExternalLink';

interface WorkCardProps {
    title: string;
    thumbnail?: string;
    description?: string;
    date?: string;
    updated?: string;
    tags?: string[];
    themes?: string[];
    isExternal?: boolean;
    analyticsId?: string;
    href: string;
}

export const WorkCard = ({ title, thumbnail, description, date, updated, tags, themes, isExternal, analyticsId, href }: WorkCardProps) => {
    const titleLink = isExternal ? (
        <ExternalLink href={href} showIndicator={false} eventName={analyticsId ? 'external_article_click' : undefined} eventProperties={analyticsId ? { contentId: analyticsId } : undefined}>{title} <small>［外部］</small></ExternalLink>
    ) : (
        <Link href={href}>{title}</Link>
    );
    const thumbnailImage = <Image src={thumbnail || '/thumbnails/default_blog.png'} alt={`${title}のサムネイル`} width={128} height={96} />;
    const thumbnailLink = isExternal ? (
        <ExternalLink href={href} className="retro-entry-image" showIndicator={false} eventName={analyticsId ? 'external_article_click' : undefined} eventProperties={analyticsId ? { contentId: analyticsId } : undefined}>
            {thumbnailImage}
        </ExternalLink>
    ) : (
        <Link href={href} className="retro-entry-image">{thumbnailImage}</Link>
    );

    return (
        <li className="retro-work-card retro-index-entry">
            {thumbnailLink}
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
