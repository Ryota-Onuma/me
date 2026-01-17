import { notFound } from 'next/navigation';
import { getBookBySlug, getBookSlugs } from '@/lib/books';
import { prefetchOGPData } from '@/lib/prefetchOGP';
import { BookDetailClient } from './BookDetailClient';

// Generate static paths for all books at build time
export async function generateStaticParams() {
    const slugs = getBookSlugs();
    return slugs.map(slug => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const book = getBookBySlug(slug);

    if (!book) {
        return { title: 'Book Not Found' };
    }

    return {
        title: `${book.frontmatter.title} by ${book.frontmatter.author} | ryota.onuma.dev`,
        description: `Book learnings: ${book.frontmatter.title} by ${book.frontmatter.author}`,
    };
}

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const book = getBookBySlug(slug);

    if (!book) {
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
                cover: book.frontmatter.cover,
                readDate: book.frontmatter.readDate,
                rating: book.frontmatter.rating,
                content: book.content,
            }}
            ogpDataMap={ogpDataMap}
        />
    );
}
