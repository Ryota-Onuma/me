import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { SCRAPS_DIRECTORY, TIMESTAMP_PATTERN } from './constants';
import { processMarkdownContent } from './markdownProcessor';
import { ContentLoadError, FrontmatterParseError } from './errors';
import type { Scrap, ScrapFrontmatter, ScrapThread, ScrapItem } from '@/types';
import { resolveThemes } from './themes';
import { ContentValidationError, validateFrontmatter } from './contentValidation';

// Re-export types for backward compatibility
export type { Scrap, ScrapFrontmatter, ScrapThread, ScrapItem };

const stringArray = (value: unknown): string[] => Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : typeof value === 'string' ? [value] : [];

const normalizeStatus = (value: unknown): ScrapFrontmatter['status'] => {
    const allowed: ScrapFrontmatter['status'][] = ['open', 'closed', 'growing', 'evergreen', 'archived', 'published'];
    return typeof value === 'string' && allowed.includes(value as ScrapFrontmatter['status'])
        ? value as ScrapFrontmatter['status']
        : 'open';
};

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
function parseScrapThreads(content: string): { threads: ScrapThread[]; isThreaded: boolean } {
    // Split by horizontal rule (--- on its own line)
    const sections = content.split(/\n---\n/).filter(s => s.trim());
    const hasTimestampedEntries = sections.some(section => TIMESTAMP_PATTERN.test(section.trim()));

    // Most existing Scraps use horizontal rules as ordinary chapter separators.
    // Treat those as one document so chapters are not mislabeled as independent posts.
    if (!hasTimestampedEntries) {
        return {
            threads: [{ id: 'thread-0', content: processMarkdownContent(content.trim()) }],
            isThreaded: false,
        };
    }

    return {
        threads: sections.map((section, index) => {
            const trimmedSection = section.trim();

            // Try to extract timestamp from heading (e.g., "## 2026-01-04 10:30")
            const timestampMatch = trimmedSection.match(TIMESTAMP_PATTERN);

            return {
                id: `thread-${index}`,
                timestamp: timestampMatch ? timestampMatch[1] : undefined,
                content: processMarkdownContent(trimmedSection),
            };
        }),
        isThreaded: true,
    };
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

        validateFrontmatter('scrap', slug, data);

        const { threads, isThreaded } = parseScrapThreads(content);
        const latestThread = threads
            .map(thread => thread.timestamp)
            .filter((value): value is string => Boolean(value))
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
        const updatedAt = [data.updated, latestThread, data.date]
            .filter((value): value is string => typeof value === 'string' && value.length > 0)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

        return {
            slug,
            frontmatter: {
                title: typeof data.title === 'string' ? data.title : 'Untitled Scrap',
                date: typeof data.date === 'string' ? data.date : '',
                status: normalizeStatus(data.status),
                tags: stringArray(data.tags),
                themes: resolveThemes({ themes: data.themes, tags: data.tags, title: typeof data.title === 'string' ? data.title : '' }),
                updated: typeof data.updated === 'string' ? data.updated : undefined,
                related: stringArray(data.related ?? data.relatedPosts ?? data.related_posts ?? data.derivedFrom ?? data.derived_from),
                sourceBooks: stringArray(data.sourceBooks ?? data.source_books ?? data.fromBooks ?? data.from_books),
                emoji: typeof data.emoji === 'string' ? data.emoji : '📝',
                internalOnly: data.internalOnly === true,
            },
            threads,
            isThreaded,
            rawContent: content,
            updatedAt,
        };
    } catch (error) {
        if (error instanceof FrontmatterParseError || error instanceof ContentValidationError) throw error;
        throw new ContentLoadError(`${slug}.md`, 'scrap', error);
    }
}

/**
 * Get all scraps sorted by most recently updated date
 */
export function getAllScraps(): Scrap[] {
    const slugs = getScrapSlugs();
    return slugs
        .map(slug => getScrapBySlug(slug))
        .filter((scrap): scrap is Scrap => scrap !== null && !scrap.frontmatter.internalOnly)
        .sort((a, b) => new Date(b.updatedAt || b.frontmatter.updated || b.frontmatter.date).getTime() - new Date(a.updatedAt || a.frontmatter.updated || a.frontmatter.date).getTime());
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
        themes: resolveThemes({
            themes: scrap.frontmatter.themes,
            tags: scrap.frontmatter.tags,
            title: scrap.frontmatter.title,
        }),
        threadCount: scrap.threads.length,
        isThreaded: scrap.isThreaded,
        lastUpdated: scrap.updatedAt || scrap.frontmatter.updated || scrap.frontmatter.date,
        related: scrap.frontmatter.related,
        sourceBooks: scrap.frontmatter.sourceBooks,
    }));
}
