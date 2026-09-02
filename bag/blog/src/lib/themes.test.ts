import { describe, expect, it } from 'vitest';
import { resolveThemes, getThemeSlug } from './themes';
import { getAllBookItems } from './books';
import { getAllContents } from './posts';
import { getRelatedContent } from './content';

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

    it('exposes inferred themes on existing blog records', () => {
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
        expect(resolveThemes({ themes: ['Observability'] })).toEqual(['observability']);
    });
});
