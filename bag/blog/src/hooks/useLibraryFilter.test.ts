import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLibraryFilter } from './useLibraryFilter';
import type { BookItem } from '@/lib/books';

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
    it('honors the selected rating order instead of pinning reading books', () => {
        const { result } = renderHook(() => useLibraryFilter(books));

        act(() => result.current.setSortOption('rating-high'));

        expect(result.current.filteredBooks.map(book => book.id)).toEqual([
            'completed-five-star',
            'reading-unrated',
        ]);
    });
});
