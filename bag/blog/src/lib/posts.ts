import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { POSTS_DIRECTORY, DEFAULT_THUMBNAIL } from './constants';
import { processMarkdownContent } from './markdownProcessor';
import { ContentLoadError, FrontmatterParseError } from './errors';
import type { Post, PostFrontmatter, ContentItem } from '@/types';
import { resolveThemes } from './themes';
import { ContentValidationError, validateFrontmatter } from './contentValidation';

// Re-export types for backward compatibility
export type { Post, PostFrontmatter, ContentItem };

const stringArray = (value: unknown): string[] => Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : typeof value === 'string' ? [value] : [];

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

        validateFrontmatter('post', slug, data);

        // Process custom markdown syntax
        const processedContent = processMarkdownContent(content);

        return {
            slug,
            frontmatter: {
                title: typeof data.title === 'string' ? data.title : 'Untitled',
                date: typeof data.date === 'string' ? data.date : '',
                tags: stringArray(data.tags),
                category: typeof data.category === 'string' ? data.category : 'Blog',
                description: typeof data.description === 'string' ? data.description : '',
                thumbnail: typeof data.thumbnail === 'string' ? data.thumbnail : DEFAULT_THUMBNAIL,
                url: typeof data.url === 'string' ? data.url : (typeof data.external_url === 'string' ? data.external_url : undefined),
                id: typeof data.id === 'string' ? data.id : undefined,
                themes: resolveThemes({ themes: data.themes, tags: data.tags, title: typeof data.title === 'string' ? data.title : '', category: typeof data.category === 'string' ? data.category : 'Blog' }),
                sourceScraps: stringArray(data.sourceScraps ?? data.source_scraps ?? data.fromScraps ?? data.from_scraps),
                sourceBooks: stringArray(data.sourceBooks ?? data.source_books ?? data.fromBooks ?? data.from_books),
                related: stringArray(data.related ?? data.relatedPosts ?? data.related_posts ?? data.derivedFrom ?? data.derived_from),
                updated: typeof data.updated === 'string' ? data.updated : undefined,
                internalOnly: data.internalOnly === true,
            },
            content: processedContent,
        };
    } catch (error) {
        if (error instanceof FrontmatterParseError || error instanceof ContentValidationError) throw error;
        throw new ContentLoadError(`${slug}.md`, 'post', error);
    }
}

/**
 * Get all posts sorted by most recently updated date
 */
export function getAllPosts(): Post[] {
    const slugs = getPostSlugs();
    return slugs
        .map(slug => getPostBySlug(slug))
        .filter((post): post is Post => post !== null && !post.frontmatter.internalOnly)
        .sort((a, b) => new Date(b.frontmatter.updated || b.frontmatter.date).getTime() - new Date(a.frontmatter.updated || a.frontmatter.date).getTime());
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
            themes: resolveThemes({
                themes: post.frontmatter.themes,
                tags: post.frontmatter.tags,
                title: post.frontmatter.title,
                category: post.frontmatter.category,
            }),
            thumbnail: post.frontmatter.thumbnail || DEFAULT_THUMBNAIL,
            url: externalUrl,
            slug: post.slug,
            updated: post.frontmatter.updated || post.frontmatter.date,
            sourceScraps: post.frontmatter.sourceScraps,
            sourceBooks: post.frontmatter.sourceBooks,
            related: post.frontmatter.related,
            hasContent: post.content.trim().length > 0,
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
