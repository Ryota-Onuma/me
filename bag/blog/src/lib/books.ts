import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { BOOKS_DIRECTORY, DEFAULT_BOOK_COVER } from './constants';
import { processMarkdownContent } from './markdownProcessor';

export interface BookFrontmatter {
    title: string;           // Required
    author: string;          // Required
    status: 'yet' | 'reading' | 'completed';  // Required
    externalUrl: string;     // Required
    tags: string[];          // Required (at least one)
    cover?: string;          // Optional
    readDate?: string;       // Optional
    rating?: number;         // Optional (1-5)
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
    cover: string;
    readDate?: string;
    rating?: number;
}

const booksPath = path.join(process.cwd(), BOOKS_DIRECTORY);

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

    // Validate required fields
    if (!data.title || !data.author || !data.status || !data.externalUrl) {
        console.error(`Book ${slug} is missing required fields`);
        return null;
    }

    // Process custom markdown syntax
    const processedContent = processMarkdownContent(content);

    return {
        slug,
        frontmatter: {
            title: data.title || 'Untitled',
            author: data.author || 'Unknown Author',
            status: ['yet', 'reading', 'completed'].includes(data.status) ? data.status : 'yet',
            externalUrl: data.externalUrl || '',
            tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
            cover: data.cover || DEFAULT_BOOK_COVER,
            readDate: data.readDate,
            rating: data.rating ? Math.min(Math.max(data.rating, 1), 5) : undefined,
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
            // Sort by readDate (newest first)
            // Books without readDate go to the end
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
        cover: book.frontmatter.cover || DEFAULT_BOOK_COVER,
        readDate: book.frontmatter.readDate,
        rating: book.frontmatter.rating,
    }));
}
