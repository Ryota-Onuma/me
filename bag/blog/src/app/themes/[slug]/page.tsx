import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ClientLayout } from '../../ClientLayout';
import { getAllThemeSlugs, getThemeContent } from '@/lib/content';

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

    return (
        <ClientLayout activePath="/themes">
            <main id="main-content" className="retro-page" tabIndex={-1}>
                <header className="retro-theme-hero">
                    <p><Link href="/themes">← テーマ一覧へ</Link></p>
                    <h1>{result.theme.label}</h1>
                    <p>{result.theme.description}</p>
                    <p className="retro-card-meta">関連する記録：{result.theme.count} 件</p>
                </header>
                <ul className="retro-theme-content-list">
                    {result.contents.map(item => (
                        <li key={`${item.type}-${item.id}`}>
                            <span className="retro-related-type">[{item.type}]</span>{' '}
                            {item.isExternal ? (
                                <a href={item.href} target="_blank" rel="noopener noreferrer">{item.title} <small>［外部］</small></a>
                            ) : (
                                <Link href={item.href}>{item.title}</Link>
                            )}
                            <p className="retro-card-meta">
                                作成：{item.date || '未登録'}{item.updated && item.updated !== item.date ? ` ｜ 更新：${item.updated}` : ''}
                            </p>
                        </li>
                    ))}
                </ul>
            </main>
        </ClientLayout>
    );
}

