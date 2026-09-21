import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentItem } from '@/lib/posts';
import { ANALYTICS_BROWSER_EVENT } from '@/lib/analytics';
import { useBlogFilter } from './useBlogFilter';

const navigation = vi.hoisted(() => ({
    pathname: '/blog',
    query: '',
    push: vi.fn(),
    replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    usePathname: () => navigation.pathname,
    useSearchParams: () => new URLSearchParams(navigation.query || window.location.search.slice(1)),
    useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
}));

const applyNavigation = (href: string) => {
    navigation.query = href.includes('?') ? href.split('?')[1] : '';
};

const contents: ContentItem[] = [
    {
        id: 'database-post',
        type: 'internal',
        title: 'PostgreSQL Index Guide',
        category: 'Database',
        description: 'B-tree indexes in practice',
        date: '2026-01-01',
        tags: ['PostgreSQL'],
        themes: ['database'],
        thumbnail: '/og.png',
        slug: 'database-post',
    },
    {
        id: 'thinking-post',
        type: 'internal',
        title: 'Concrete and Abstract Thinking',
        category: 'Thinking',
        description: 'A practical thinking exercise',
        date: '2026-01-02',
        tags: ['Practice'],
        themes: ['thinking'],
        thumbnail: '/og.png',
        slug: 'thinking-post',
    },
];

describe('useBlogFilter', () => {
    beforeEach(() => {
        navigation.query = '';
        window.history.replaceState(null, '', navigation.pathname);
        navigation.push.mockReset();
        navigation.replace.mockReset();
        navigation.push.mockImplementation(applyNavigation);
        navigation.replace.mockImplementation(applyNavigation);
    });

    it('reads a shared URL and follows history changes', () => {
        navigation.query = 'q=index&theme=database&tag=PostgreSQL';
        const { result, rerender } = renderHook(() => useBlogFilter(contents));

        expect(result.current.searchQuery).toBe('index');
        expect(result.current.selectedTheme).toBe('database');
        expect(result.current.selectedTag).toBe('PostgreSQL');
        expect(result.current.filteredContents.map(item => item.id)).toEqual(['database-post']);

        navigation.query = 'theme=thinking';
        rerender();
        expect(result.current.searchQuery).toBe('');
        expect(result.current.selectedTag).toBeNull();
        expect(result.current.filteredContents.map(item => item.id)).toEqual(['thinking-post']);
    });

    it('updates search URLs without navigation and records deliberate facet changes', () => {
        const { result, rerender } = renderHook(() => useBlogFilter(contents));

        act(() => result.current.setSearchQuery('index'));
        expect(window.location.pathname + window.location.search).toBe('/blog?q=index');
        rerender();

        act(() => result.current.setSelectedTheme('database'));
        expect(window.location.pathname + window.location.search).toBe('/blog?q=index&theme=database');
    });

    it('resets all supported filters while preserving unrelated parameters', () => {
        navigation.query = 'q=index&theme=Database&tag=PostgreSQL&status=open&sort=rating-high&ref=home';
        const { result } = renderHook(() => useBlogFilter(contents));

        act(() => result.current.resetFilters());

        expect(window.location.pathname + window.location.search).toBe('/blog?ref=home');
    });

    it('tracks query use without exposing the search text', () => {
        const events: CustomEvent[] = [];
        const listener = (event: Event) => events.push(event as CustomEvent);
        window.addEventListener(ANALYTICS_BROWSER_EVENT, listener);
        const { result } = renderHook(() => useBlogFilter(contents));

        act(() => result.current.setSearchQuery('private search text'));

        window.removeEventListener(ANALYTICS_BROWSER_EVENT, listener);
        expect(events).toHaveLength(1);
        expect(events[0].detail).toEqual({
            name: 'filter_use',
            properties: { collection: 'blog', filter: 'q', active: true },
        });
        expect(JSON.stringify(events[0].detail)).not.toContain('private search text');
    });
});
