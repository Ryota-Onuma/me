import { getAllContents } from './posts';
import { getAllScrapItems } from './scraps';
import { getAllBookItems } from './books';
import { getThemeDefinition, getThemeLabel, getThemeSlug } from './themes';

export type UnifiedType = 'Blog' | 'Scrap' | 'Library';

export interface UnifiedContent {
    id: string;
    type: UnifiedType;
    title: string;
    date: string;
    updated: string;
    themes: string[];
    href: string;
    isExternal: boolean;
    hasNotes?: boolean;
    description?: string;
    relation?: string;
}

export interface ThemeEntry {
    slug: string;
    label: string;
    description: string;
    count: number;
    blogCount: number;
    scrapCount: number;
    libraryCount: number;
}

const timestamp = (value?: string): number => {
    if (!value) return 0;
    const result = new Date(value).getTime();
    return Number.isNaN(result) ? 0 : result;
};

const sortNewest = <T extends { updated: string }>(items: T[]): T[] => [...items].sort((a, b) => timestamp(b.updated) - timestamp(a.updated));

export function getUnifiedContent(): UnifiedContent[] {
    const posts = getAllContents().map((item): UnifiedContent => ({
        id: item.slug || item.id,
        type: 'Blog',
        title: item.title,
        date: item.date,
        updated: item.updated || item.date,
        themes: item.themes || [],
        href: item.type === 'external' && !item.hasContent && item.url ? item.url : `/blog/${item.slug}`,
        isExternal: item.type === 'external' && !item.hasContent,
        description: item.description,
    }));
    const scraps = getAllScrapItems().map((item): UnifiedContent => ({
        id: item.slug,
        type: 'Scrap',
        title: item.title,
        date: item.date,
        updated: item.lastUpdated,
        themes: item.themes || [],
        href: `/scrap/${item.slug}`,
        isExternal: false,
    }));
    const books = getAllBookItems().map((item): UnifiedContent => ({
        id: item.slug,
        type: 'Library',
        title: item.title,
        date: item.readDate || item.updated || '',
        updated: item.updated || item.readDate || '',
        themes: item.themes || [],
        href: item.hasNotes ? `/library/${item.slug}` : item.externalUrl,
        isExternal: !item.hasNotes,
        hasNotes: item.hasNotes,
    }));
    return sortNewest([...posts, ...scraps, ...books]);
}

export function getThemeEntries(): ThemeEntry[] {
    const contents = getUnifiedContent();
    const counts = new Map<string, { count: number; blogCount: number; scrapCount: number; libraryCount: number }>();
    for (const item of contents) {
        for (const theme of item.themes) {
            const current = counts.get(theme) || { count: 0, blogCount: 0, scrapCount: 0, libraryCount: 0 };
            current.count += 1;
            if (item.type === 'Blog') current.blogCount += 1;
            if (item.type === 'Scrap') current.scrapCount += 1;
            if (item.type === 'Library') current.libraryCount += 1;
            counts.set(theme, current);
        }
    }
    return Array.from(counts.entries())
        .map(([slug, count]) => ({
            slug,
            label: getThemeLabel(slug),
            description: getThemeDefinition(slug)?.description || 'このテーマに紐づく記録',
            ...count,
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function getThemeBySlug(value: string): ThemeEntry | null {
    const slug = getThemeSlug(value);
    return getThemeEntries().find(theme => theme.slug === slug) || null;
}

export function getThemeContent(slugValue: string): {
    theme: ThemeEntry;
    contents: UnifiedContent[];
} | null {
    const theme = getThemeBySlug(slugValue);
    if (!theme) return null;
    return {
        theme,
        contents: getUnifiedContent().filter(item => item.themes.includes(theme.slug)),
    };
}

export function getAllThemeSlugs(): string[] {
    const contentSlugs = getThemeEntries().map(theme => theme.slug);
    // Definitions with no current content are intentionally omitted from the
    // public index, while still remaining available for future frontmatter.
    return Array.from(new Set([...contentSlugs])).filter(Boolean);
}

const relationValues = (value?: string[]): string[] => value || [];

/** Find same-theme and explicitly related records for a detail page. */
export function getRelatedContent(kind: 'post' | 'scrap' | 'book', slug: string): UnifiedContent[] {
    const posts = getAllContents();
    const scraps = getAllScrapItems();
    const books = getAllBookItems();
    const currentPost = kind === 'post' ? posts.find(item => item.slug === slug) : undefined;
    const currentScrap = kind === 'scrap' ? scraps.find(item => item.slug === slug) : undefined;
    const currentBook = kind === 'book' ? books.find(item => item.slug === slug) : undefined;
    if (!currentPost && !currentScrap && !currentBook) return [];

    const currentThemes = currentPost?.themes || currentScrap?.themes || currentBook?.themes || [];
    const explicit = new Set<string>([
        ...relationValues(currentPost?.related),
        ...relationValues(currentPost?.sourceScraps),
        ...relationValues(currentPost?.sourceBooks),
        ...relationValues(currentScrap?.related),
        ...relationValues(currentScrap?.sourceBooks),
        ...relationValues(currentBook?.related),
        ...relationValues(currentBook?.sourcePosts),
        ...relationValues(currentBook?.sourceScraps),
    ]);

    // Also follow the reverse side of a relation. This lets a Scrap show the
    // Blog that was distilled from it even when only the Blog declares
    // `sourceScraps` in its frontmatter.
    if (currentScrap) {
        for (const post of posts) if (post.sourceScraps?.includes(slug)) explicit.add(post.slug || post.id);
        for (const book of books) if (book.sourceScraps?.includes(slug)) explicit.add(book.slug);
    }
    if (currentPost) {
        for (const scrap of scraps) if (scrap.related?.includes(slug)) explicit.add(scrap.slug);
        for (const book of books) if (book.sourcePosts?.includes(slug)) explicit.add(book.slug);
    }
    if (currentBook) {
        for (const post of posts) if (post.sourceBooks?.includes(slug)) explicit.add(post.slug || post.id);
        for (const scrap of scraps) if (scrap.sourceBooks?.includes(slug)) explicit.add(scrap.slug);
    }

    const currentId = slug;
    return getUnifiedContent()
        .filter(item => item.id !== currentId)
        .map(item => {
            const isExplicit = explicit.has(item.id);
            const sharedTheme = item.themes.some(theme => currentThemes.includes(theme));
            return { item, score: (isExplicit ? 100 : 0) + (sharedTheme ? 10 : 0) };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || timestamp(b.item.updated) - timestamp(a.item.updated))
        .slice(0, 8)
        .map(({ item }) => item);
}

export function getHomeThemes(limit = 5): ThemeEntry[] {
    return getThemeEntries().slice(0, limit);
}
