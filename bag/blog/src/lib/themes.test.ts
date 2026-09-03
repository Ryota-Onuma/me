import { describe, expect, it } from 'vitest';
import { resolveThemes, getThemeSlug } from './themes';
import { getAllBookItems } from './books';
import { getAllContents } from './posts';
import { getAllScrapItems } from './scraps';
import { getRelatedContent, getUnifiedContent } from './content';
import { ContentValidationError, validateFrontmatter } from './contentValidation';

describe('shared themes', () => {
    it('maps legacy topical tags to a canonical theme', () => {
        expect(resolveThemes({ tags: ['PostgreSQL', 'Database', 'Zenn'] })).toContain('database');
        expect(resolveThemes({ tags: ['English', 'Shadowing'] })).toContain('english');
    });

    it('does not promote publication or media tags to themes', () => {
        const themes = resolveThemes({ tags: ['Book'], title: '手を動かしてわかるクリーンアーキテクチャ' });
        expect(themes).toContain('software-design');
        expect(themes).not.toContain('book');
        expect(themes).not.toContain('audible');
    });

    it('keeps empty-note books in the library while marking them for external links', () => {
        const coupling = getAllBookItems().find(book => book.slug === 'coupling-balance');
        expect(coupling?.hasNotes).toBe(false);
        expect(coupling?.externalUrl).toMatch(/^https:/);
    });

    it('keeps a contentful external article discoverable through an internal intro', () => {
        const zenn = getUnifiedContent().find(item => item.id === 'buysell-zenn-elasticsearch-join-field');
        expect(zenn?.isExternal).toBe(false);
        expect(zenn?.href).toBe('/blog/buysell-zenn-elasticsearch-join-field');

        const emptyExternal = getUnifiedContent().find(item => item.id === 'buysell-circleci-github-actions');
        expect(emptyExternal?.isExternal).toBe(true);
        expect(emptyExternal?.href).toMatch(/^https:/);
    });

    it('exposes explicit themes on existing blog records', () => {
        const post = getAllContents().find(item => item.id === 'postgresql-btree-locality');
        expect(post?.themes).toContain('database');
    });

    it('connects a finished Blog back to the books that informed it', () => {
        const related = getRelatedContent('post', 'concrete-abstract-thinking');
        expect(related.some(item => item.id === 'concrete-abstract-training')).toBe(true);
        expect(related.some(item => item.id === 'concrete-and-abstract')).toBe(true);
    });

    it('creates URL-safe slugs for canonical themes', () => {
        expect(getThemeSlug('Software Design')).toBe('software-design');
        expect(resolveThemes({ themes: ['Observability'] })).toEqual([]);
    });

    it('does not assign Learning to unclassified content', () => {
        expect(resolveThemes({ title: '分類されていない記録', tags: ['Book'] })).toEqual([]);
    });
});

describe('content frontmatter validation', () => {
    it('accepts the current content inventory', () => {
        expect(() => getAllContents()).not.toThrow();
        expect(() => getAllScrapItems()).not.toThrow();
        expect(() => getAllBookItems()).not.toThrow();
    });

    it('reports invalid dates, themes, URLs, images, and relations with the slug', () => {
        const validateBrokenPost = () => validateFrontmatter('post', 'broken-example', {
            title: 'Broken',
            date: 'Jan 02, 2026',
            tags: [],
            themes: ['Observability'],
            thumbnail: '/thumbnails/does-not-exist.png',
            external_url: 'not a URL',
            sourceBooks: ['does-not-exist'],
        });
        expect(validateBrokenPost).toThrowError(ContentValidationError);
        expect(validateBrokenPost).toThrow(/date must use a real YYYY-MM-DD date/);
        expect(validateBrokenPost).toThrow(/unknown theme/);
        expect(validateBrokenPost).toThrow(/missing local image/);
        expect(validateBrokenPost).toThrow(/valid HTTP\(S\) URL/);
        expect(validateBrokenPost).toThrow(/missing book slug/);

        try {
            validateFrontmatter('post', 'broken-example', {
                title: 'Broken',
                date: '2026-02-30',
                tags: [],
                themes: ['Observability'],
                related: ['does-not-exist'],
            });
        } catch (error) {
            expect(error).toBeInstanceOf(ContentValidationError);
            expect((error as Error).message).toContain('content/posts/broken-example.md');
            expect((error as Error).message).toContain('date must use a real YYYY-MM-DD date');
            expect((error as Error).message).toContain('unknown theme');
            expect((error as Error).message).toContain('missing content slug');
        }
    });

    it('rejects missing required fields and invalid enum or rating values', () => {
        expect(() => validateFrontmatter('scrap', 'broken-scrap', {
            date: '2026-01-01',
            status: 'unknown',
            tags: [],
            themes: ['Learning'],
        })).toThrow(/title must be a non-empty string/);

        expect(() => validateFrontmatter('book', 'broken-book', {
            title: 'Broken book',
            author: 'Author',
            status: 'finished',
            externalUrl: 'https://example.com/book',
            tags: ['Book'],
            themes: ['Learning'],
            rating: 6,
        })).toThrow(/status must be one of:[\s\S]*rating must be an integer from 1 to 5/);
    });
});
