import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ClientLayout } from '../../ClientLayout';
import { getAllThemeSlugs, getThemeContent, getThemeEntries } from '@/lib/content';
import { AnalyticsEvent } from '@/components/analytics/AnalyticsEvent';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { ARCHIVE_SECTIONS, formatAccessionNumber } from '@/data/site';

const TYPE_LABELS = { Blog: '技術', Scrap: '雑記', Library: '読書' } as const;

export function generateStaticParams() {
    return getAllThemeSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const result = getThemeContent(slug);
    if (!result) return { title: 'テーマが見つかりません' };
    const title = `${result.theme.label} | ryota.onuma.dev`;
    return {
        title,
        description: result.theme.description,
        alternates: { canonical: `/themes/${result.theme.slug}` },
        openGraph: { title, description: result.theme.description, url: `/themes/${result.theme.slug}`, type: 'website', images: ['/og.png'] },
        twitter: { card: 'summary_large_image', title, description: result.theme.description, images: ['/og.png'] },
    };
}

export default async function ThemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const result = getThemeContent(slug);
    if (!result) notFound();
    const themeIndex = getThemeEntries().findIndex(theme => theme.slug === slug);

    return (
        <ClientLayout activePath="/themes">
            <main id="main-content" className="retro-page" tabIndex={-1}>
                <AnalyticsEvent name="theme_open" properties={{ theme: result.theme.slug }} />
                <header className="retro-theme-hero">
                    <p><Link href="/themes">← テーマ一覧へ</Link></p>
                    <div className="retro-record-stamp">
                        <span>索引票</span>
                        <b>{formatAccessionNumber(ARCHIVE_SECTIONS.themes.accessionPrefix, themeIndex)}</b>
                    </div>
                    <p className="retro-kicker">CROSS-COLLECTION INDEX</p>
                    <h1>{result.theme.label}</h1>
                    <p>{result.theme.description}</p>
                    <p className="retro-card-meta">関連する記録：{result.theme.count} 件</p>
                </header>
                <ul className="retro-theme-content-list">
                    {result.contents.map((item, index) => (
                        <li key={`${item.type}-${item.id}`} className="retro-index-entry">
                            <p className="retro-accession">{formatAccessionNumber(item.type === 'Blog' ? 'TN' : item.type === 'Scrap' ? 'SC' : 'BK', index)}</p>
                            <p className="retro-entry-type">{TYPE_LABELS[item.type]}</p>
                            <div className="retro-entry-body">
                                <h2>{item.isExternal ? (
                                <ExternalLink href={item.href} eventName="external_article_click" eventProperties={{ contentId: item.id }}>{item.title}</ExternalLink>
                            ) : (
                                <TrackedLink href={item.href} eventName="related_click" properties={{ contentType: item.type, contentId: item.id }}>{item.title}</TrackedLink>
                            )}</h2>
                            </div>
                            <p className="retro-entry-date">
                                <small>更新</small>
                                {item.updated || item.date || '未登録'}
                                {item.updated && item.updated !== item.date && <span>作成 {item.date}</span>}
                            </p>
                        </li>
                    ))}
                </ul>
            </main>
        </ClientLayout>
    );
}
