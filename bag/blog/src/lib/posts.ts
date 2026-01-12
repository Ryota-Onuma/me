import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { POSTS_DIRECTORY, DEFAULT_THUMBNAIL } from './constants';
import { processMarkdownContent } from './markdownProcessor';
import { ContentLoadError, FrontmatterParseError, handleContentError } from './errors';
import type { Post, PostFrontmatter, ContentItem } from '@/types';

// Re-export types for backward compatibility
export type { Post, PostFrontmatter, ContentItem };

const postsPath = path.join(process.cwd(), POSTS_DIRECTORY);

/**
 * Get all post slugs for static generation
 */
export function getPostSlugs(): string[] {
    if (!fs.existsSync(postsPath)) {
        return [];
    }
    return fs.readdirSync(postsPath)
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace(/\.md$/, ''));
}

/**
 * Get a single post by slug
 */
export function getPostBySlug(slug: string): Post | null {
    const fullPath = path.join(postsPath, `${slug}.md`);

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    try {
        const fileContents = fs.readFileSync(fullPath, 'utf8');

        let data: Record<string, unknown>;
        let content: string;

        try {
            const parsed = matter(fileContents);
            data = parsed.data as Record<string, unknown>;
            content = parsed.content;
        } catch (error) {
            throw new FrontmatterParseError(`${slug}.md`, error);
        }

        // Process custom markdown syntax
        const processedContent = processMarkdownContent(content);

        return {
            slug,
            frontmatter: {
                title: typeof data.title === 'string' ? data.title : 'Untitled',
                date: typeof data.date === 'string' ? data.date : '',
                tags: Array.isArray(data.tags) ? data.tags as string[] : (typeof data.tags === 'string' ? [data.tags] : []),
                category: typeof data.category === 'string' ? data.category : 'Blog',
                description: typeof data.description === 'string' ? data.description : '',
                thumbnail: typeof data.thumbnail === 'string' ? data.thumbnail : DEFAULT_THUMBNAIL,
                url: typeof data.url === 'string' ? data.url : (typeof data.external_url === 'string' ? data.external_url : undefined),
                id: typeof data.id === 'string' ? data.id : undefined,
            },
            content: processedContent,
        };
    } catch (error) {
        if (error instanceof FrontmatterParseError) {
            return handleContentError(error, `${slug}.md`, 'post');
        }
        throw new ContentLoadError(`${slug}.md`, 'post', error);
    }
}

/**
 * Get all posts sorted by date
 */
export function getAllPosts(): Post[] {
    const slugs = getPostSlugs();
    return slugs
        .map(slug => {
            try {
                return getPostBySlug(slug);
            } catch (error) {
                return handleContentError(error, `${slug}.md`, 'post');
            }
        })
        .filter((post): post is Post => post !== null)
        .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
}

/**
 * Get all content items (for blog list)
 */
export function getAllContents(): ContentItem[] {
    const posts = getAllPosts();

    return posts.map(post => {
        const externalUrl = post.frontmatter.url;

        return {
            id: post.frontmatter.id || post.slug,
            type: externalUrl ? 'external' : 'internal',
            title: post.frontmatter.title,
            category: post.frontmatter.category || 'Blog',
            description: post.frontmatter.description || '',
            date: post.frontmatter.date,
            tags: post.frontmatter.tags,
            thumbnail: post.frontmatter.thumbnail || DEFAULT_THUMBNAIL,
            url: externalUrl,
            slug: externalUrl ? undefined : post.slug,
        };
    });
}

/**
 * Get prev/next posts for navigation
 */
export function getAdjacentPosts(slug: string): { prev: ContentItem | null; next: ContentItem | null } {
    const contents = getAllContents();
    const currentIndex = contents.findIndex(c => c.slug === slug);

    if (currentIndex === -1) {
        return { prev: null, next: null };
    }

    return {
        prev: contents[currentIndex - 1] ?? null,
        next: contents[currentIndex + 1] ?? null,
    };
}
