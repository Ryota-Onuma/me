import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLibraryFilter } from './useLibraryFilter';
import type { BookItem } from '@/lib/books';

const navigation = vi.hoisted(() => ({
    pathname: '/library',
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

const books: BookItem[] = [
    {
        id: 'reading-unrated',
        slug: 'reading-unrated',
        title: 'Reading Unrated',
        author: 'A',
        status: 'reading',
        externalUrl: 'https://example.com/a',
        tags: ['Test'],
        cover: '/books/default_cover.png',
    },
    {
        id: 'completed-five-star',
        slug: 'completed-five-star',
        title: 'Completed Five Star',
        author: 'B',
        status: 'completed',
        externalUrl: 'https://example.com/b',
        tags: ['Test'],
        cover: '/books/default_cover.png',
        readDate: '2026-01-01',
        rating: 5,
    },
];

describe('useLibraryFilter', () => {
    beforeEach(() => {
        navigation.query = '';
        window.history.replaceState(null, '', navigation.pathname);
        navigation.push.mockReset();
        navigation.replace.mockReset();
        navigation.push.mockImplementation(applyNavigation);
        navigation.replace.mockImplementation(applyNavigation);
    });

    it('honors the selected rating order instead of pinning reading books', () => {
        const { result, rerender } = renderHook(() => useLibraryFilter(books));

        act(() => result.current.setSortOption('rating-high'));
        rerender();

        expect(result.current.filteredBooks.map(book => book.id)).toEqual([
            'completed-five-star',
            'reading-unrated',
        ]);
        expect(window.location.pathname + window.location.search).toBe('/library?sort=rating-high');
    });

    it('hydrates every filter from a shared URL and follows history changes', () => {
        navigation.query = 'q=completed&tag=Test&status=completed&sort=rating-high';
        const { result, rerender } = renderHook(() => useLibraryFilter(books));

        expect(result.current.searchQuery).toBe('completed');
        expect(result.current.selectedTag).toBe('Test');
        expect(result.current.statusFilter).toBe('completed');
        expect(result.current.sortOption).toBe('rating-high');
        expect(result.current.filteredBooks.map(book => book.id)).toEqual(['completed-five-star']);

        navigation.query = 'status=reading&sort=readDate-oldest';
        rerender();
        expect(result.current.searchQuery).toBe('');
        expect(result.current.statusFilter).toBe('reading');
        expect(result.current.filteredBooks.map(book => book.id)).toEqual(['reading-unrated']);
    });

    it('updates query URLs and resets all supported parameters', () => {
        const { result, rerender } = renderHook(() => useLibraryFilter(books));

        act(() => result.current.setSearchQuery('Reading'));
        expect(window.location.pathname + window.location.search).toBe('/library?q=Reading');
        rerender();

        act(() => result.current.setStatusFilter('reading'));
        rerender();
        act(() => result.current.resetFilters());

        expect(window.location.pathname + window.location.search).toBe('/library');
    });
});
