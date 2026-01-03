import { notFound } from 'next/navigation';
import { getScrapBySlug, getScrapSlugs } from '@/lib/scraps';
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

    return <ScrapDetailClient scrap={scrap} />;
}
