import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { SCRAPS_DIRECTORY, TIMESTAMP_PATTERN } from './constants';
import { processMarkdownContent } from './markdownProcessor';
import { ContentLoadError, FrontmatterParseError, handleContentError } from './errors';
import type { Scrap, ScrapFrontmatter, ScrapThread, ScrapItem } from '@/types';

// Re-export types for backward compatibility
export type { Scrap, ScrapFrontmatter, ScrapThread, ScrapItem };

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
        const timestampMatch = trimmedSection.match(TIMESTAMP_PATTERN);

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

        const threads = parseScrapThreads(content);

        return {
            slug,
            frontmatter: {
                title: typeof data.title === 'string' ? data.title : 'Untitled Scrap',
                date: typeof data.date === 'string' ? data.date : '',
                status: data.status === 'closed' ? 'closed' : 'open',
                tags: Array.isArray(data.tags) ? data.tags as string[] : (typeof data.tags === 'string' ? [data.tags] : []),
                emoji: typeof data.emoji === 'string' ? data.emoji : '📝',
            },
            threads,
            rawContent: content,
        };
    } catch (error) {
        if (error instanceof FrontmatterParseError) {
            return handleContentError(error, `${slug}.md`, 'scrap');
        }
        throw new ContentLoadError(`${slug}.md`, 'scrap', error);
    }
}

/**
 * Get all scraps sorted by date
 */
export function getAllScraps(): Scrap[] {
    const slugs = getScrapSlugs();
    return slugs
        .map(slug => {
            try {
                return getScrapBySlug(slug);
            } catch (error) {
                return handleContentError(error, `${slug}.md`, 'scrap');
            }
        })
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
