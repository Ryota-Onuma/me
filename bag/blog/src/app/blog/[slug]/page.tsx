import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, getPostSlugs, getAdjacentPosts } from '@/lib/posts';
import { getRelatedContent } from '@/lib/content';
import { prefetchOGPData } from '@/lib/prefetchOGP';
import { BlogDetailClient } from './BlogDetailClient';

// Generate static paths for all posts at build time
export async function generateStaticParams() {
    const slugs = getPostSlugs();
    return slugs.map(slug => ({ slug }));
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
    const url = `/blog/${slug}`;
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const { prev, next } = getAdjacentPosts(slug);

    // Pre-fetch OGP data for link cards at build time
    const ogpDataMap = await prefetchOGPData(post.content);

    return (
        <BlogDetailClient
            post={{
                title: post.frontmatter.title,
                date: post.frontmatter.date,
                tags: post.frontmatter.tags,
                themes: post.frontmatter.themes,
                updated: post.frontmatter.updated || post.frontmatter.date,
                thumbnail: post.frontmatter.thumbnail,
                content: post.content,
            }}
            prevPost={prev}
            nextPost={next}
            relatedContent={getRelatedContent('post', slug)}
            ogpDataMap={ogpDataMap}
        />
    );
}
