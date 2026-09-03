import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { BOOKS_DIRECTORY, DEFAULT_BOOK_COVER } from './constants';
import { processMarkdownContent } from './markdownProcessor';
import { resolveThemes } from './themes';
import { validateFrontmatter } from './contentValidation';

export interface BookFrontmatter {
    title: string;           // Required
    author: string;          // Required
    status: 'yet' | 'reading' | 'completed';  // Required
    externalUrl: string;     // Required
    tags: string[];          // Required (at least one)
    cover?: string;          // Optional
    readDate?: string;       // Optional
    rating?: number;         // Optional (1-5)
    externalLabel?: string;  // Optional
    themes?: string[];
    related?: string[];
    derivedFrom?: string[];
    sourcePosts?: string[];
    sourceScraps?: string[];
    updated?: string;
}

export interface Book {
    slug: string;
    frontmatter: BookFrontmatter;
    content: string;
}

export interface BookItem {
    id: string;
    slug: string;
    title: string;
    author: string;
    status: 'yet' | 'reading' | 'completed';
    externalUrl: string;
    tags: string[];
    themes?: string[];
    cover: string;
    readDate?: string;
    rating?: number;
    externalLabel?: string;
    hasNotes?: boolean;
    updated?: string;
    related?: string[];
    sourcePosts?: string[];
    sourceScraps?: string[];
}

const booksPath = path.join(process.cwd(), BOOKS_DIRECTORY);

const stringArray = (value: unknown): string[] => Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : typeof value === 'string' ? [value] : [];

/**
 * Get all book slugs for static generation
 */
export function getBookSlugs(): string[] {
    if (!fs.existsSync(booksPath)) {
        return [];
    }
    return fs.readdirSync(booksPath)
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace(/\.md$/, ''));
}

/**
 * Get a single book by slug
 */
export function getBookBySlug(slug: string): Book | null {
    const fullPath = path.join(booksPath, `${slug}.md`);

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    validateFrontmatter('book', slug, data as Record<string, unknown>);

    // Process custom markdown syntax
    const processedContent = processMarkdownContent(content);

    return {
        slug,
        frontmatter: {
            title: data.title || 'Untitled',
            author: data.author || 'Unknown Author',
            status: data.status,
            externalUrl: data.externalUrl,
            tags: stringArray(data.tags),
            cover: data.cover || DEFAULT_BOOK_COVER,
            readDate: data.readDate,
            rating: data.rating,
            externalLabel: data.externalLabel,
            themes: resolveThemes({ themes: data.themes, tags: data.tags, title: typeof data.title === 'string' ? data.title : '' }),
            related: stringArray(data.related ?? data.relatedPosts ?? data.related_posts ?? data.derivedFrom ?? data.derived_from),
            sourcePosts: stringArray(data.sourcePosts ?? data.source_posts ?? data.relatedPosts ?? data.related_posts),
            sourceScraps: stringArray(data.sourceScraps ?? data.source_scraps ?? data.relatedScraps ?? data.related_scraps),
            updated: typeof data.updated === 'string' ? data.updated : undefined,
        },
        content: processedContent,
    };
}

/**
 * Get all books sorted by readDate (newest first)
 */
export function getAllBooks(): Book[] {
    const slugs = getBookSlugs();
    return slugs
        .map(slug => getBookBySlug(slug))
        .filter((book): book is Book => book !== null)
        .sort((a, b) => {
            // Sort by status: 'reading' first
            if (a.frontmatter.status === 'reading' && b.frontmatter.status !== 'reading') return -1;
            if (a.frontmatter.status !== 'reading' && b.frontmatter.status === 'reading') return 1;

            // Then sort by readDate (newest first)
            const dateA = a.frontmatter.readDate ? new Date(a.frontmatter.readDate).getTime() : 0;
            const dateB = b.frontmatter.readDate ? new Date(b.frontmatter.readDate).getTime() : 0;
            return dateB - dateA;
        });
}

/**
 * Get all book items (for library list)
 */
export function getAllBookItems(): BookItem[] {
    const books = getAllBooks();

    return books.map(book => ({
        id: book.slug,
        slug: book.slug,
        title: book.frontmatter.title,
        author: book.frontmatter.author,
        status: book.frontmatter.status,
        externalUrl: book.frontmatter.externalUrl,
        tags: book.frontmatter.tags,
        themes: resolveThemes({
            themes: book.frontmatter.themes,
            tags: book.frontmatter.tags,
            title: book.frontmatter.title,
        }),
        cover: book.frontmatter.cover || DEFAULT_BOOK_COVER,
        readDate: book.frontmatter.readDate,
        rating: book.frontmatter.rating,
        externalLabel: book.frontmatter.externalLabel,
        hasNotes: book.content.trim().length > 0,
        updated: book.frontmatter.updated || book.frontmatter.readDate,
        related: book.frontmatter.related,
        sourcePosts: book.frontmatter.sourcePosts,
        sourceScraps: book.frontmatter.sourceScraps,
    }));
}
