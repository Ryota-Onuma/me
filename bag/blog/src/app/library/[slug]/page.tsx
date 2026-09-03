import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBookBySlug, getBookSlugs } from '@/lib/books';
import { getRelatedContent } from '@/lib/content';
import { prefetchOGPData } from '@/lib/prefetchOGP';
import { BookDetailClient } from './BookDetailClient';
import { DEFAULT_BOOK_COVER } from '@/lib/constants';
import { absoluteSiteUrl, serializeJsonLd, SITE_AUTHOR, toIsoDate } from '@/lib/detailSeo';
import { AnalyticsEvent } from '@/components/analytics/AnalyticsEvent';

// Generate static paths for all books at build time
export async function generateStaticParams() {
    return getBookSlugs()
        .map(slug => getBookBySlug(slug))
        .filter((book): book is NonNullable<ReturnType<typeof getBookBySlug>> => Boolean(book?.content.trim()))
        .map(book => ({ slug: book.slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const book = getBookBySlug(slug);

    if (!book) {
        return { title: 'Book Not Found' };
    }
    if (!book.content.trim()) {
        return { title: `${book.frontmatter.title} | 読書記録` };
    }

    const title = `${book.frontmatter.title}（${book.frontmatter.author}） | ryota.onuma.dev`;
    const description = `読書メモ：${book.frontmatter.title}（${book.frontmatter.author}）`;
    const url = `/library/${slug}`;
    const recordDate = toIsoDate(book.frontmatter.updated || book.frontmatter.readDate);
    const image = book.frontmatter.cover && book.frontmatter.cover !== DEFAULT_BOOK_COVER
        ? absoluteSiteUrl(book.frontmatter.cover)
        : undefined;
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'article',
            tags: book.frontmatter.tags,
            publishedTime: recordDate,
            modifiedTime: recordDate,
            authors: [SITE_AUTHOR.url],
            images: image ? [{ url: image, alt: `${book.frontmatter.title}の表紙` }] : [],
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images: image ? [image] : [],
        },
    };
}

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const book = getBookBySlug(slug);

    if (!book) {
        notFound();
    }
    // A record without notes still appears in /library, but does not get an
    // empty internal page. The card links directly to the book information.
    if (!book.content.trim()) {
        notFound();
    }

    // Pre-fetch OGP data for link cards at build time
    const ogpDataMap = await prefetchOGPData(book.content);
    const image = book.frontmatter.cover && book.frontmatter.cover !== DEFAULT_BOOK_COVER
        ? absoluteSiteUrl(book.frontmatter.cover)
        : undefined;
    const recordDate = toIsoDate(book.frontmatter.updated || book.frontmatter.readDate);
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Review',
        name: `読書メモ：${book.frontmatter.title}`,
        description: `読書メモ：${book.frontmatter.title}（${book.frontmatter.author}）`,
        author: { '@type': 'Person', ...SITE_AUTHOR },
        datePublished: recordDate,
        dateModified: recordDate,
        url: absoluteSiteUrl(`/library/${slug}`),
        itemReviewed: {
            '@type': 'Book',
            name: book.frontmatter.title,
            author: { '@type': 'Person', name: book.frontmatter.author },
            image,
            url: book.frontmatter.externalUrl,
        },
        reviewRating: book.frontmatter.rating ? {
            '@type': 'Rating',
            ratingValue: book.frontmatter.rating,
            bestRating: 5,
            worstRating: 1,
        } : undefined,
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
            <AnalyticsEvent name="content_open" properties={{ contentType: 'library', contentId: slug }} />
            <BookDetailClient
                book={{
                    title: book.frontmatter.title,
                    author: book.frontmatter.author,
                    status: book.frontmatter.status,
                    externalUrl: book.frontmatter.externalUrl,
                    tags: book.frontmatter.tags,
                    themes: book.frontmatter.themes,
                    cover: book.frontmatter.cover,
                    readDate: book.frontmatter.readDate,
                    rating: book.frontmatter.rating,
                    externalLabel: book.frontmatter.externalLabel,
                    updated: book.frontmatter.updated || book.frontmatter.readDate,
                    content: book.content,
                }}
                relatedContent={getRelatedContent('book', slug)}
                ogpDataMap={ogpDataMap}
            />
        </>
    );
}
