import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPostBySlug, getPostSlugs, getAdjacentPosts, getAllContents } from '@/lib/posts';
import { getRelatedContent } from '@/lib/content';
import { prefetchOGPData } from '@/lib/prefetchOGP';
import { BlogDetailClient } from './BlogDetailClient';
import { DEFAULT_THUMBNAIL } from '@/lib/constants';
import { absoluteSiteUrl, serializeJsonLd, SITE_AUTHOR, toIsoDate } from '@/lib/detailSeo';
import { AnalyticsEvent } from '@/components/analytics/AnalyticsEvent';
import { ARCHIVE_SECTIONS, formatAccessionNumber } from '@/data/site';

// Generate static paths for all posts at build time
export async function generateStaticParams() {
    return getPostSlugs()
        .map(slug => getPostBySlug(slug))
        .filter((post): post is NonNullable<ReturnType<typeof getPostBySlug>> => Boolean(post && (!post.frontmatter.url || post.content.trim())))
        .map(post => ({ slug: post.slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        return { title: 'Post Not Found' };
    }

    const title = `${post.frontmatter.title} | ryota.onuma.dev`;
    const description = post.frontmatter.description || post.frontmatter.title;
    if (post.frontmatter.url && !post.content.trim()) {
        return {
            title,
            description,
            alternates: { canonical: post.frontmatter.url },
            robots: { index: false, follow: false },
        };
    }
    const url = `/blog/${slug}`;
    const publishedTime = toIsoDate(post.frontmatter.date);
    const modifiedTime = toIsoDate(post.frontmatter.updated || post.frontmatter.date);
    const image = post.frontmatter.thumbnail && post.frontmatter.thumbnail !== DEFAULT_THUMBNAIL
        ? absoluteSiteUrl(post.frontmatter.thumbnail)
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
            tags: post.frontmatter.tags,
            publishedTime,
            modifiedTime,
            authors: [SITE_AUTHOR.url],
            images: image ? [{ url: image, alt: post.frontmatter.title }] : [],
        },
        twitter: {
            card: image ? 'summary_large_image' : 'summary',
            title,
            description,
            images: image ? [image] : [],
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    // Empty external records are intentionally direct links in the archive;
    // keep a manually entered URL from rendering a misleading blank page.
    if (post.frontmatter.url && !post.content.trim()) {
        redirect(post.frontmatter.url);
    }

    const { prev, next } = getAdjacentPosts(slug);
    const archiveIndex = getAllContents().findIndex(item => item.slug === slug);

    // Pre-fetch OGP data for link cards at build time
    const ogpDataMap = await prefetchOGPData(post.content);
    const description = post.frontmatter.description || post.frontmatter.title;
    const image = post.frontmatter.thumbnail && post.frontmatter.thumbnail !== DEFAULT_THUMBNAIL
        ? absoluteSiteUrl(post.frontmatter.thumbnail)
        : undefined;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.frontmatter.title,
        description,
        datePublished: toIsoDate(post.frontmatter.date),
        dateModified: toIsoDate(post.frontmatter.updated || post.frontmatter.date),
        author: { '@type': 'Person', ...SITE_AUTHOR },
        mainEntityOfPage: absoluteSiteUrl(`/blog/${slug}`),
        image,
        keywords: post.frontmatter.tags.length ? post.frontmatter.tags.join(', ') : undefined,
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
            <AnalyticsEvent name="content_open" properties={{ contentType: 'blog', contentId: slug }} />
            <BlogDetailClient
                post={{
                    accession: formatAccessionNumber(ARCHIVE_SECTIONS.blog.accessionPrefix, archiveIndex),
                    title: post.frontmatter.title,
                    date: post.frontmatter.date,
                    tags: post.frontmatter.tags,
                    themes: post.frontmatter.themes,
                    updated: post.frontmatter.updated || post.frontmatter.date,
                    thumbnail: post.frontmatter.thumbnail,
                    externalUrl: post.frontmatter.url,
                    content: post.content,
                }}
                prevPost={prev}
                nextPost={next}
                relatedContent={getRelatedContent('post', slug)}
                ogpDataMap={ogpDataMap}
            />
        </>
    );
}
