import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScrapBySlug, getScrapSlugs } from '@/lib/scraps';
import { getRelatedContent } from '@/lib/content';
import { prefetchOGPData } from '@/lib/prefetchOGP';
import { ScrapDetailClient } from './ScrapDetailClient';
import { absoluteSiteUrl, serializeJsonLd, SITE_AUTHOR, toIsoDate } from '@/lib/detailSeo';
import { AnalyticsEvent } from '@/components/analytics/AnalyticsEvent';

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
    const description = scrap.frontmatter.tags.length
        ? `${scrap.frontmatter.title} — ${scrap.frontmatter.tags.join('、')}についての雑記`
        : `${scrap.frontmatter.title}についての雑記`;
    const url = `/scrap/${slug}`;
    const publishedTime = toIsoDate(scrap.frontmatter.date);
    const modifiedTime = toIsoDate(scrap.updatedAt || scrap.frontmatter.updated || scrap.frontmatter.date);

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'article',
            tags: scrap.frontmatter.tags,
            publishedTime,
            modifiedTime,
            authors: [SITE_AUTHOR.url],
            images: [],
        },
        twitter: { card: 'summary', title, description, images: [] },
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
    const description = scrap.frontmatter.tags.length
        ? `${scrap.frontmatter.title} — ${scrap.frontmatter.tags.join('、')}についての雑記`
        : `${scrap.frontmatter.title}についての雑記`;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: scrap.frontmatter.title,
        description,
        datePublished: toIsoDate(scrap.frontmatter.date),
        dateModified: toIsoDate(scrap.updatedAt || scrap.frontmatter.updated || scrap.frontmatter.date),
        author: { '@type': 'Person', ...SITE_AUTHOR },
        mainEntityOfPage: absoluteSiteUrl(`/scrap/${slug}`),
        keywords: scrap.frontmatter.tags.length ? scrap.frontmatter.tags.join(', ') : undefined,
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
            <AnalyticsEvent name="content_open" properties={{ contentType: 'scrap', contentId: slug }} />
            <ScrapDetailClient scrap={scrap} relatedContent={getRelatedContent('scrap', slug)} ogpDataMap={ogpDataMap} />
        </>
    );
}
