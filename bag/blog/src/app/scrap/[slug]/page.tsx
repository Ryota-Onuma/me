import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScrapBySlug, getScrapSlugs } from '@/lib/scraps';
import { getRelatedContent } from '@/lib/content';
import { prefetchOGPData } from '@/lib/prefetchOGP';
import { ScrapDetailClient } from './ScrapDetailClient';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const slugs = getScrapSlugs();
    return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const scrap = getScrapBySlug(slug);

    if (!scrap) {
        return { title: '雑記が見つかりません' };
    }

    const title = `${scrap.frontmatter.title} | ryota.onuma.dev`;
    const description = `${scrap.frontmatter.title} — ${scrap.frontmatter.tags.join('、')}についての雑記`;
    const url = `/scrap/${slug}`;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, type: 'article', images: ['/og.png'] },
        twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
    };
}

export default async function ScrapDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const scrap = getScrapBySlug(slug);

    if (!scrap) {
        notFound();
    }

    // Collect all thread contents and pre-fetch OGP data
    const allContent = scrap.threads.map(t => t.content).join('\n');
    const ogpDataMap = await prefetchOGPData(allContent);

    return <ScrapDetailClient scrap={scrap} relatedContent={getRelatedContent('scrap', slug)} ogpDataMap={ogpDataMap} />;
}
