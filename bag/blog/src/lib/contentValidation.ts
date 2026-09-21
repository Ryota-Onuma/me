import fs from 'fs';
import path from 'path';
import { BOOKS_DIRECTORY, DEFAULT_BOOK_COVER, DEFAULT_THUMBNAIL, POSTS_DIRECTORY, SCRAPS_DIRECTORY } from './constants';
import { normalizeTheme } from './themes';

type Frontmatter = Record<string, unknown>;
type ContentKind = 'post' | 'scrap' | 'book';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SCRAP_STATUSES = new Set(['open', 'closed', 'growing', 'evergreen', 'archived', 'published']);
const BOOK_STATUSES = new Set(['yet', 'reading', 'completed']);

export class ContentValidationError extends Error {
    constructor(public readonly fileName: string, public readonly issues: string[]) {
        super(`Invalid frontmatter in ${fileName}:\n- ${issues.join('\n- ')}`);
        this.name = 'ContentValidationError';
    }
}

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function isIsoDate(value: unknown): value is string {
    if (!isNonEmptyString(value) || !ISO_DATE.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validateRequiredString(data: Frontmatter, field: string, issues: string[]): void {
    if (!isNonEmptyString(data[field])) issues.push(`${field} must be a non-empty string`);
}

function validateStringArray(data: Frontmatter, field: string, issues: string[], options: { required?: boolean; nonEmpty?: boolean } = {}): string[] {
    const value = data[field];
    if (value === undefined) {
        if (options.required) issues.push(`${field} is required`);
        return [];
    }
    if (!Array.isArray(value) || value.some(item => !isNonEmptyString(item))) {
        issues.push(`${field} must be an array of non-empty strings`);
        return [];
    }
    if (options.nonEmpty && value.length === 0) issues.push(`${field} must contain at least one value`);
    return value as string[];
}

function validateDate(data: Frontmatter, field: string, issues: string[], required = false): void {
    const value = data[field];
    if (value === undefined) {
        if (required) issues.push(`${field} is required`);
        return;
    }
    if (!isIsoDate(value)) issues.push(`${field} must use a real YYYY-MM-DD date`);
}

function validateUrl(data: Frontmatter, field: string, issues: string[], required = false): void {
    const value = data[field];
    if (value === undefined) {
        if (required) issues.push(`${field} is required`);
        return;
    }
    if (!isNonEmptyString(value)) {
        issues.push(`${field} must be a non-empty HTTP(S) URL`);
        return;
    }
    try {
        const parsed = new URL(value);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('unsupported protocol');
    } catch {
        issues.push(`${field} must be a valid HTTP(S) URL`);
    }
}

function validateLocalImage(value: unknown, field: string, fallback: string, issues: string[]): void {
    const image = value === undefined ? fallback : value;
    if (!isNonEmptyString(image) || !image.startsWith('/')) {
        issues.push(`${field} must be a root-relative local image path`);
        return;
    }
    const publicDirectory = path.resolve(process.cwd(), 'public');
    const imagePath = path.resolve(publicDirectory, image.slice(1));
    if (!imagePath.startsWith(`${publicDirectory}${path.sep}`) || !fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) {
        issues.push(`${field} references a missing local image: ${image}`);
    }
}

function markdownSlugs(directory: string): Set<string> {
    const directoryPath = path.join(process.cwd(), directory);
    if (!fs.existsSync(directoryPath)) return new Set();
    return new Set(fs.readdirSync(directoryPath).filter(file => file.endsWith('.md')).map(file => file.replace(/\.md$/, '')));
}

function validateRelations(data: Frontmatter, fields: Array<{ names: string[]; allowed: Set<string>; label: string }>, issues: string[]): void {
    for (const { names, allowed, label } of fields) {
        const name = names.find(candidate => data[candidate] !== undefined);
        if (!name) continue;
        const values = validateStringArray(data, name, issues);
        for (const slug of values) {
            if (!allowed.has(slug)) issues.push(`${name} references missing ${label} slug: ${slug}`);
        }
    }
}

function validateThemes(data: Frontmatter, issues: string[]): void {
    const isPublic = data.draft !== true && data.internalOnly !== true;
    const themes = validateStringArray(data, 'themes', issues, { required: isPublic, nonEmpty: isPublic });
    for (const theme of themes) {
        if (!normalizeTheme(theme)) issues.push(`themes contains unknown theme: ${theme}`);
    }
}

function relationSets(): { posts: Set<string>; scraps: Set<string>; books: Set<string>; all: Set<string> } {
    const posts = markdownSlugs(POSTS_DIRECTORY);
    const scraps = markdownSlugs(SCRAPS_DIRECTORY);
    const books = markdownSlugs(BOOKS_DIRECTORY);
    return { posts, scraps, books, all: new Set([...posts, ...scraps, ...books]) };
}

export function validateFrontmatter(kind: ContentKind, slug: string, data: Frontmatter): void {
    const fileName = `${kind === 'post' ? POSTS_DIRECTORY : kind === 'scrap' ? SCRAPS_DIRECTORY : BOOKS_DIRECTORY}/${slug}.md`;
    const issues: string[] = [];
    const slugs = relationSets();

    if (data.internalOnly !== undefined && typeof data.internalOnly !== 'boolean') {
        issues.push('internalOnly must be a boolean');
    }

    validateRequiredString(data, 'title', issues);
    validateStringArray(data, 'tags', issues, { required: true, nonEmpty: kind === 'book' });
    validateThemes(data, issues);
    validateDate(data, 'updated', issues);

    if (kind === 'post') {
        validateDate(data, 'date', issues, true);
        validateLocalImage(data.thumbnail, 'thumbnail', DEFAULT_THUMBNAIL, issues);
        if (data.url !== undefined) validateUrl(data, 'url', issues);
        if (data.external_url !== undefined) validateUrl(data, 'external_url', issues);
        validateRelations(data, [
            { names: ['sourceScraps', 'source_scraps', 'fromScraps', 'from_scraps'], allowed: slugs.scraps, label: 'scrap' },
            { names: ['sourceBooks', 'source_books', 'fromBooks', 'from_books'], allowed: slugs.books, label: 'book' },
            { names: ['related', 'relatedPosts', 'related_posts', 'derivedFrom', 'derived_from'], allowed: slugs.all, label: 'content' },
        ], issues);
    } else if (kind === 'scrap') {
        validateDate(data, 'date', issues, true);
        if (!isNonEmptyString(data.status) || !SCRAP_STATUSES.has(data.status)) {
            issues.push(`status must be one of: ${Array.from(SCRAP_STATUSES).join(', ')}`);
        }
        validateRelations(data, [
            { names: ['sourceBooks', 'source_books', 'fromBooks', 'from_books'], allowed: slugs.books, label: 'book' },
            { names: ['related', 'relatedPosts', 'related_posts', 'derivedFrom', 'derived_from'], allowed: slugs.all, label: 'content' },
        ], issues);
    } else {
        validateRequiredString(data, 'author', issues);
        if (!isNonEmptyString(data.status) || !BOOK_STATUSES.has(data.status)) {
            issues.push(`status must be one of: ${Array.from(BOOK_STATUSES).join(', ')}`);
        }
        validateUrl(data, 'externalUrl', issues, true);
        validateLocalImage(data.cover, 'cover', DEFAULT_BOOK_COVER, issues);
        validateDate(data, 'readDate', issues);
        if (data.rating !== undefined && (typeof data.rating !== 'number' || !Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5)) {
            issues.push('rating must be an integer from 1 to 5');
        }
        validateRelations(data, [
            { names: ['sourcePosts', 'source_posts', 'relatedPosts', 'related_posts'], allowed: slugs.posts, label: 'post' },
            { names: ['sourceScraps', 'source_scraps', 'relatedScraps', 'related_scraps'], allowed: slugs.scraps, label: 'scrap' },
            { names: ['related', 'derivedFrom', 'derived_from'], allowed: slugs.all, label: 'content' },
        ], issues);
    }

    if (issues.length) throw new ContentValidationError(fileName, issues);
}
