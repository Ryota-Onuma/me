import Link from 'next/link';
import Image from 'next/image';
import { SOCIAL_LINKS } from '@/data/socialLinks';
import type { ThemeEntry } from '@/lib/content';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { ARCHIVE_SECTIONS, formatAccessionNumber, SITE_DESCRIPTION } from '@/data/site';

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
        <div className="retro-home-intro">
            <div className="retro-main-column">
                <p className="retro-kicker">ROOM 001 / ENTRANCE</p>
                <h1><span lang="en">Ryota Onuma</span>の個人資料室</h1>
                <p className="retro-welcome">集めたものを、あとから取り出せる形に。</p>
                <p>ソフトウェアエンジニアの<span lang="en">Ryota Onuma</span>です。ここは、{SITE_DESCRIPTION}</p>
                <p className="retro-room-guide">整理した技術記事、書きかけのメモ、読んだ本を、それぞれの棚と索引からたどれます。</p>
                <p><Link href="/blog">最初の棚を見る →</Link></p>
            </div>

            <figure className="retro-profile">
                <Image
                    src={ARCHIVE_SECTIONS.about.illustration}
                    alt="資料室で紙や本を整理する手描きのキャラクター"
                    width={1536}
                    height={1024}
                    sizes="(max-width: 700px) 100vw, 52vw"
                    priority
                />
                <figcaption>この資料室の整理係</figcaption>
            </figure>
        </div>

        <div className="retro-home-content">
            <section className="retro-home-block retro-home-featured" aria-labelledby="featured-heading">
                <header className="retro-home-section-heading">
                    <span>01</span>
                    <div>
                        <h2 id="featured-heading">最初に読む3件</h2>
                        <p>実務、思考、学び方が見える入口の資料です。</p>
                    </div>
                </header>
                <ol className="retro-featured-list">
                    {featured.map((item, index) => (
                        <li key={item.id}>
                            <span className="retro-accession">{formatAccessionNumber('TN', index)}</span>
                            <p className="retro-featured-title">
                                <span className="retro-related-type">[{featuredCategoryLabel[item.category] || item.category}]</span>{' '}
                                {item.isExternal ? <ExternalLink href={item.href} eventName="external_article_click" eventProperties={{ contentId: item.id }}>{item.title}</ExternalLink> : <TrackedLink href={item.href} eventName="related_click" properties={{ collection: 'home', contentId: item.id }}>{item.title}</TrackedLink>}
                            </p>
                            {item.description && <p>{item.description}</p>}
                        </li>
                    ))}
                </ol>
            </section>

            <section className="retro-home-block" aria-labelledby="archive-heading">
                <header className="retro-home-section-heading">
                    <span>02</span>
                    <div>
                        <h2 id="archive-heading">3つの棚</h2>
                        <p>資料の状態に合わせて、収める場所を分けています。</p>
                    </div>
                </header>
                <div className="retro-home-directory-grid retro-index">
                    <article className="retro-shelf retro-shelf-blog">
                        <Image src={ARCHIVE_SECTIONS.blog.illustration} alt="" width={1536} height={1024} sizes="180px" />
                        <p className="retro-kicker">SHELF {ARCHIVE_SECTIONS.blog.accessionPrefix}</p>
                        <h3><Link href={ARCHIVE_SECTIONS.blog.href}>{ARCHIVE_SECTIONS.blog.title}</Link></h3>
                        <p>{ARCHIVE_SECTIONS.blog.subtitle}。実装や仕事で得た知見を、読み返せる形にまとめています。</p>
                        <p className="retro-card-meta">収蔵 {archiveCounts.blog}件</p>
                    </article>
                    <article className="retro-shelf retro-shelf-scrap">
                        <Image src={ARCHIVE_SECTIONS.scrap.illustration} alt="" width={1312} height={1199} sizes="180px" />
                        <p className="retro-kicker">SHELF {ARCHIVE_SECTIONS.scrap.accessionPrefix}</p>
                        <h3><Link href={ARCHIVE_SECTIONS.scrap.href}>{ARCHIVE_SECTIONS.scrap.title}</Link></h3>
                        <p>{ARCHIVE_SECTIONS.scrap.subtitle}。小さな発見や、まだ整理しきれていない考えを置いています。</p>
                        <p className="retro-card-meta">収蔵 {archiveCounts.scrap}件</p>
                    </article>
                    <article className="retro-shelf retro-shelf-library">
                        <Image src={ARCHIVE_SECTIONS.library.illustration} alt="" width={1319} height={1192} sizes="180px" />
                        <p className="retro-kicker">SHELF {ARCHIVE_SECTIONS.library.accessionPrefix}</p>
                        <h3><Link href={ARCHIVE_SECTIONS.library.href}>{ARCHIVE_SECTIONS.library.title}</Link></h3>
                        <p>{ARCHIVE_SECTIONS.library.subtitle}。読んだ本と、そこから持ち帰った視点を記録しています。</p>
                        <p className="retro-card-meta">収蔵 {archiveCounts.library}冊</p>
                    </article>
                </div>
            </section>

            <section className="retro-home-block retro-theme-index-block" aria-labelledby="themes-heading">
                <div>
                    <header className="retro-home-section-heading">
                        <span>03</span>
                        <div>
                            <h2 id="themes-heading">テーマ索引</h2>
                            <p>棚をまたいで、関心のつながりから資料を引けます。</p>
                        </div>
                    </header>
                    <ul className="retro-theme-picks">
                        {themes.map(theme => (
                            <li key={theme.slug}>
                                <Link href={`/themes/${theme.slug}`}>{theme.label}</Link>
                                <span className="retro-card-meta">（{theme.count} 件）</span>
                            </li>
                        ))}
                    </ul>
                    <p><Link href="/themes">すべての索引を見る →</Link></p>
                </div>
                <Image src={ARCHIVE_SECTIONS.themes.illustration} alt="" width={1366} height={1151} sizes="220px" />
            </section>

            <section className="retro-home-block" aria-labelledby="updates-heading">
                <header className="retro-home-section-heading">
                    <span>04</span>
                    <div>
                        <h2 id="updates-heading">更新台帳</h2>
                        <p>最近、棚に加わったものと書き直したもの。</p>
                    </div>
                </header>
                <ul className="retro-updates-list">
                    {updates.map((item, index) => (
                        <li key={item.id}>
                            <span className="retro-accession">{formatAccessionNumber('UP', index)}</span>{' '}
                            <time dateTime={formatDate(item.date)}>{formatDate(item.date)}</time>{' '}
                            <span className="retro-related-type">[{updateTypeLabel[item.type] || item.type}・{item.activity}]</span>{' '}
                            {!item.isExternal && item.href ? <TrackedLink href={item.href} eventName="related_click" properties={{ collection: 'home', contentId: item.id }}>{item.title}</TrackedLink> : <ExternalLink href={item.href || '#'} eventName="external_article_click" eventProperties={{ contentId: item.id }}>{item.title}</ExternalLink>}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="retro-home-block retro-home-follow" aria-labelledby="follow-heading">
                <h2 id="follow-heading">資料室の便り</h2>
                <ul className="retro-follow-links">
                    <li><TrackedLink href="/feed.xml" eventName="rss_click">RSS 2.0で更新を購読する</TrackedLink></li>
                    {SOCIAL_LINKS.map((link) => (
                        <li key={link.label}><ExternalLink href={link.href}>{link.label}</ExternalLink></li>
                    ))}
                </ul>
            </section>

            <div className="retro-notice">
                <b>このサイトのデザインについて</b><br />
                青いリンクと文書らしさを残しながら、紙、索引、棚、手描きの線で個人の資料室として整えています。外部リンクは新しいタブで開きます。
            </div>
        </div>
    </section>
);
