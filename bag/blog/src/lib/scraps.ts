import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { SCRAPS_DIRECTORY } from './constants';
import { processMarkdownContent } from './markdownProcessor';

export interface ScrapFrontmatter {
    title: string;
    date: string;
    status: 'open' | 'closed';
    tags: string[];
    emoji?: string;
}

export interface ScrapThread {
    id: string;
    timestamp?: string;
    content: string;
}

export interface Scrap {
    slug: string;
    frontmatter: ScrapFrontmatter;
    threads: ScrapThread[];
    rawContent: string;
}

export interface ScrapItem {
    id: string;
    slug: string;
    title: string;
    emoji: string;
    status: 'open' | 'closed';
    date: string;
    tags: string[];
    threadCount: number;
    lastUpdated: string;
}

const scrapsPath = path.join(process.cwd(), SCRAPS_DIRECTORY);

/**
 * Get all scrap slugs for static generation
 */
export function getScrapSlugs(): string[] {
    if (!fs.existsSync(scrapsPath)) {
        return [];
    }
    return fs.readdirSync(scrapsPath)
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace(/\.md$/, ''));
}

/**
 * Parse content into threads separated by horizontal rules (---)
 */
function parseScrapThreads(content: string): ScrapThread[] {
    // Split by horizontal rule (--- on its own line)
    const sections = content.split(/\n---\n/).filter(s => s.trim());

    return sections.map((section, index) => {
        const trimmedSection = section.trim();

        // Try to extract timestamp from heading (e.g., "## 2026-01-04 10:30")
        const timestampMatch = trimmedSection.match(/^##\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);

        return {
            id: `thread-${index}`,
            timestamp: timestampMatch ? timestampMatch[1] : undefined,
            content: processMarkdownContent(trimmedSection),
        };
    });
}

/**
 * Get a single scrap by slug
 */
export function getScrapBySlug(slug: string): Scrap | null {
    const fullPath = path.join(scrapsPath, `${slug}.md`);

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const threads = parseScrapThreads(content);

    return {
        slug,
        frontmatter: {
            title: data.title || 'Untitled Scrap',
            date: data.date || '',
            status: data.status === 'closed' ? 'closed' : 'open',
            tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
            emoji: data.emoji || '📝',
        },
        threads,
        rawContent: content,
    };
}

/**
 * Get all scraps sorted by date
 */
export function getAllScraps(): Scrap[] {
    const slugs = getScrapSlugs();
    return slugs
        .map(slug => getScrapBySlug(slug))
        .filter((scrap): scrap is Scrap => scrap !== null)
        .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
}

/**
 * Get all scrap items (for scrap list)
 */
export function getAllScrapItems(): ScrapItem[] {
    const scraps = getAllScraps();

    return scraps.map(scrap => ({
        id: scrap.slug,
        slug: scrap.slug,
        title: scrap.frontmatter.title,
        emoji: scrap.frontmatter.emoji || '📝',
        status: scrap.frontmatter.status,
        date: scrap.frontmatter.date,
        tags: scrap.frontmatter.tags,
        threadCount: scrap.threads.length,
        lastUpdated: scrap.frontmatter.date, // Could be enhanced to track last thread update
    }));
}
