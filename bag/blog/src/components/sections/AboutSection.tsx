import Link from 'next/link';
import Image from 'next/image';
import { SOCIAL_LINKS } from '@/data/socialLinks';
import type { ThemeEntry } from '@/lib/content';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { SITE_DESCRIPTION } from '@/data/site';

interface UpdateItem {
    id: string;
    type: string;
    title: string;
    date: string;
    href?: string;
    isExternal: boolean;
    activity: string;
}

interface AboutSectionProps {
    updates: UpdateItem[];
    featured: Array<{
        id: string;
        title: string;
        description?: string;
        href: string;
        isExternal: boolean;
        category: string;
    }>;
    themes: ThemeEntry[];
    archiveCounts: { blog: number; scrap: number; library: number };
}

const formatDate = (date: string): string => {
    const dateOnly = date.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
    if (dateOnly) {
        return `${dateOnly[1]}-${dateOnly[2].padStart(2, '0')}-${dateOnly[3].padStart(2, '0')}`;
    }
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date.slice(0, 10);
    return parsed.toISOString().slice(0, 10);
};

const updateTypeLabel: Record<string, string> = {
    Blog: '技術',
    Scrap: '雑記',
    Library: '読書',
};

const featuredCategoryLabel: Record<string, string> = {
    Blog: '技術',
    Thinking: '考察',
    Tutorial: '解説',
};

export const AboutSection = ({ updates, featured, themes, archiveCounts }: AboutSectionProps) => (
    <section id="about" className="retro-home">
        <div className="retro-home-layout">
            <figure className="retro-profile">
                <Image src="/profile.jpg" alt="二輪車に乗る手描きキャラクター" width={320} height={400} priority />
                <figcaption>プロフィール用の手描きイラスト</figcaption>
            </figure>

            <div className="retro-main-column">
                <h1><span lang="en">Ryota Onuma</span>のホームページ</h1>
                <p className="retro-welcome">Welcome to my homepage!</p>
                <p>ソフトウェアエンジニアの<span lang="en">Ryota Onuma</span>です。{SITE_DESCRIPTION}</p>

                <h2>はじめての方へ</h2>
                <p>実務、思考、学び方が分かる3本を選びました。</p>
                <ol className="retro-featured-list">
                    {featured.map(item => (
                        <li key={item.id}>
                            <p className="retro-featured-title">
                                <span className="retro-related-type">[{featuredCategoryLabel[item.category] || item.category}]</span>{' '}
                                {item.isExternal ? <ExternalLink href={item.href} eventName="external_article_click" eventProperties={{ contentId: item.id }}>{item.title}</ExternalLink> : <TrackedLink href={item.href} eventName="related_click" properties={{ collection: 'home', contentId: item.id }}>{item.title}</TrackedLink>}
                            </p>
                            {item.description && <p>{item.description}</p>}
                        </li>
                    ))}
                </ol>

                <h2>記録を探す</h2>
                <ul className="retro-index retro-archive-index">
                    <li><Link href="/blog">技術ノート</Link>（{archiveCounts.blog}件）― 実装と仕事の記録、長めの考察</li>
                    <li><Link href="/scrap">雑記帳</Link>（{archiveCounts.scrap}件）― 小さな発見と考え途中のメモ</li>
                    <li><Link href="/library">読書記録</Link>（{archiveCounts.library}冊）― 読んだ本と、そこから得た学び</li>
                </ul>

                <h2>いま気になっているテーマ</h2>
                <p className="retro-section-note">件数順ではなく、このページ用に選んだテーマです。</p>
                <ul className="retro-theme-picks">
                    {themes.map(theme => (
                        <li key={theme.slug}>
                            <Link href={`/themes/${theme.slug}`}>{theme.label}</Link>
                            <span className="retro-card-meta">（{theme.count} 件）</span>
                        </li>
                    ))}
                </ul>

                <h2>最近の更新</h2>
                <ul className="retro-updates-list">
                    {updates.map(item => (
                        <li key={item.id}>
                            <time dateTime={formatDate(item.date)}>{formatDate(item.date)}</time>{' '}
                            <span className="retro-related-type">[{updateTypeLabel[item.type] || item.type}・{item.activity}]</span>{' '}
                            {!item.isExternal && item.href ? <TrackedLink href={item.href} eventName="related_click" properties={{ collection: 'home', contentId: item.id }}>{item.title}</TrackedLink> : <ExternalLink href={item.href || '#'} eventName="external_article_click" eventProperties={{ contentId: item.id }}>{item.title}</ExternalLink>}
                        </li>
                    ))}
                </ul>

                <h2>更新を追う</h2>
                <ul className="retro-follow-links">
                    <li><TrackedLink href="/feed.xml" eventName="rss_click">RSS 2.0で更新を購読する</TrackedLink></li>
                    {SOCIAL_LINKS.map((link) => (
                        <li key={link.label}><ExternalLink href={link.href}>{link.label}</ExternalLink></li>
                    ))}
                </ul>

                <div className="retro-notice">
                    <b>このサイトのデザインについて</b><br />
                    1990年代の個人ホームページの文書らしさを、現代のアクセシビリティと軽量な実装で再構成しています。外部リンクは新しいタブで開きます。
                </div>
            </div>
        </div>
    </section>
);
