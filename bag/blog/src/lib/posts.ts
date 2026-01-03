import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { POSTS_DIRECTORY, DEFAULT_THUMBNAIL } from './constants';
import { processMarkdownContent } from './markdown-processor';

export interface PostFrontmatter {
    id?: string;
    title: string;
    category?: string;
    description?: string;
    date: string;
    tags: string[];
    thumbnail?: string;
    url?: string;
    external_url?: string;
}

export interface Post {
    slug: string;
    frontmatter: PostFrontmatter;
    content: string;
}

export interface ContentItem {
    id: string;
    type: 'external' | 'internal';
    title: string;
    category: string;
    description: string;
    date: string;
    tags: string[];
    thumbnail: string;
    url?: string;
    slug?: string;
}

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

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Process custom markdown syntax
    const processedContent = processMarkdownContent(content);

    return {
        slug,
        frontmatter: {
            title: data.title || 'Untitled',
            date: data.date || '',
            tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
            category: data.category || 'Blog',
            description: data.description || '',
            thumbnail: data.thumbnail || DEFAULT_THUMBNAIL,
            url: data.url || data.external_url,
            id: data.id,
        },
        content: processedContent,
    };
}

/**
 * Get all posts sorted by date
 */
export function getAllPosts(): Post[] {
    const slugs = getPostSlugs();
    return slugs
        .map(slug => getPostBySlug(slug))
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
