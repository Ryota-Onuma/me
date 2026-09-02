import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBookBySlug, getBookSlugs } from '@/lib/books';
import { getRelatedContent } from '@/lib/content';
import { prefetchOGPData } from '@/lib/prefetchOGP';
import { BookDetailClient } from './BookDetailClient';

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
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'article',
            images: ['/og.png'],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['/og.png'],
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

    return (
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
    );
}
