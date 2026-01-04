import { notFound } from 'next/navigation';
import { getScrapBySlug, getScrapSlugs } from '@/lib/scraps';
import { prefetchOGPData } from '@/lib/prefetchOGP';
import { ScrapDetailClient } from './ScrapDetailClient';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const slugs = getScrapSlugs();
    return slugs.map((slug) => ({ slug }));
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

    return <ScrapDetailClient scrap={scrap} ogpDataMap={ogpDataMap} />;
}

