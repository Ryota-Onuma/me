import { notFound } from 'next/navigation';
import { getPostBySlug, getPostSlugs, getAdjacentPosts } from '@/lib/posts';
import { prefetchOGPData } from '@/lib/prefetchOGP';
import { BlogDetailClient } from './BlogDetailClient';

// Generate static paths for all posts at build time
export async function generateStaticParams() {
    const slugs = getPostSlugs();
    return slugs.map(slug => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        return { title: 'Post Not Found' };
    }

    return {
        title: `${post.frontmatter.title} | Ryota Onuma`,
        description: post.frontmatter.description || post.frontmatter.title,
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
                thumbnail: post.frontmatter.thumbnail,
                content: post.content,
            }}
            prevPost={prev}
            nextPost={next}
            ogpDataMap={ogpDataMap}
        />
    );
}

