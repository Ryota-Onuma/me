'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { BookItem } from '@/lib/books';
import { trackAnalyticsEvent } from '@/lib/analytics';
import { isMediaTag, normalizeTheme } from '@/lib/themes';
import { useSynchronizedSearchParams } from './useSynchronizedSearchParams';

export type BookStatus = 'all' | 'yet' | 'reading' | 'completed';
export type SortOption = 'readDate-newest' | 'readDate-oldest' | 'rating-high' | 'rating-low';

export interface UseLibraryFilterResult {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedTag: string | null;
    setSelectedTag: (tag: string | null) => void;
    selectedTheme: string | null;
    setSelectedTheme: (theme: string | null) => void;
    statusFilter: BookStatus;
    setStatusFilter: (status: BookStatus) => void;
    sortOption: SortOption;
    setSortOption: (option: SortOption) => void;
    allTags: string[];
    allThemes: string[];
    filteredBooks: BookItem[];
    totalCount: number;
    filteredCount: number;
    resetFilters: () => void;
}

/**
 * useLibraryFilter - 書籍の検索、タグ、ステータス、ソートを管理する
 */
export const useLibraryFilter = (books: BookItem[] = []): UseLibraryFilterResult => {
    const searchParams = useSynchronizedSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchQuery = searchParams.get('q') ?? '';
    const selectedTag = searchParams.get('tag');
    const rawTheme = searchParams.get('theme');
    const selectedTheme = rawTheme ? (normalizeTheme(rawTheme) || rawTheme) : null;
    const rawStatus = searchParams.get('status');
    const statusFilter: BookStatus = rawStatus && STATUS_OPTIONS.has(rawStatus as BookStatus)
        ? rawStatus as BookStatus
        : 'all';
    const rawSort = searchParams.get('sort');
    const sortOption: SortOption = rawSort && SORT_OPTIONS.has(rawSort as SortOption)
        ? rawSort as SortOption
        : 'readDate-newest';

    const updateParams = useCallback((
        update: (params: URLSearchParams) => void,
        method: 'push' | 'replace' = 'push'
    ) => {
        const newParams = new URLSearchParams(searchParams.toString());
        update(newParams);
        const query = newParams.toString();
        const href = query ? `${pathname}?${query}` : pathname;
        if (typeof window !== 'undefined') {
            window.history[method === 'replace' ? 'replaceState' : 'pushState'](window.history.state, '', href);
            window.dispatchEvent(new PopStateEvent('popstate'));
            return;
        }
        router[method](href, { scroll: false });
    }, [pathname, router, searchParams]);

    const setSearchQuery = (query: string) => {
        trackAnalyticsEvent('filter_use', { collection: 'library', filter: 'q', active: Boolean(query) });
        updateParams(params => {
            if (query) params.set('q', query);
            else params.delete('q');
        }, 'replace');
    };

    const setSelectedTag = (tag: string | null) => {
        trackAnalyticsEvent('filter_use', { collection: 'library', filter: 'tag', active: Boolean(tag) });
        updateParams(params => {
            if (tag) params.set('tag', tag);
            else params.delete('tag');
        });
    };

    const setSelectedTheme = (theme: string | null) => {
        trackAnalyticsEvent('filter_use', { collection: 'library', filter: 'theme', active: Boolean(theme) });
        updateParams(params => {
            if (theme) params.set('theme', theme);
            else params.delete('theme');
        });
    };

    const setStatusFilter = (status: BookStatus) => {
        trackAnalyticsEvent('filter_use', { collection: 'library', filter: 'status', active: status !== 'all' });
        updateParams(params => {
            if (status === 'all') params.delete('status');
            else params.set('status', status);
        });
    };

    const setSortOption = (option: SortOption) => {
        trackAnalyticsEvent('filter_use', { collection: 'library', filter: 'sort', active: option !== 'readDate-newest' });
        updateParams(params => {
            if (option === 'readDate-newest') params.delete('sort');
            else params.set('sort', option);
        });
    };

    const resetFilters = () => {
        trackAnalyticsEvent('filter_use', { collection: 'library', filter: 'reset', active: false });
        updateParams(params => {
            ['q', 'theme', 'tag', 'status', 'sort'].forEach(key => params.delete(key));
        });
    };

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        books.forEach(book => book.tags.filter(tag => !isMediaTag(tag) && !normalizeTheme(tag)).forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [books]);

    const allThemes = useMemo(() => Array.from(new Set(books.flatMap(book => book.themes || []))).sort(), [books]);

    const filteredBooks = useMemo(() => {
        // Filter
        let filtered = books.filter(book => {
            // Search: title OR author
            const matchesSearch =
                book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                book.author.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = selectedTag === null || book.tags.includes(selectedTag);
            const matchesTheme = selectedTheme === null || book.themes?.includes(selectedTheme);
            const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
            return matchesSearch && matchesTag && matchesTheme && matchesStatus;
        });

        // Sort
        filtered = filtered.sort((a, b) => {
            switch (sortOption) {
                case 'readDate-newest': {
                    const dateA = a.readDate ? new Date(a.readDate).getTime() : 0;
                    const dateB = b.readDate ? new Date(b.readDate).getTime() : 0;
                    return dateB - dateA;
                }
                case 'readDate-oldest': {
                    const dateA = a.readDate ? new Date(a.readDate).getTime() : Number.MAX_SAFE_INTEGER;
                    const dateB = b.readDate ? new Date(b.readDate).getTime() : Number.MAX_SAFE_INTEGER;
                    return dateA - dateB;
                }
                case 'rating-high': {
                    const ratingA = a.rating ?? 0;
                    const ratingB = b.rating ?? 0;
                    return ratingB - ratingA;
                }
                case 'rating-low': {
                    const ratingA = a.rating ?? Number.MAX_SAFE_INTEGER;
                    const ratingB = b.rating ?? Number.MAX_SAFE_INTEGER;
                    return ratingA - ratingB;
                }
                default:
                    return 0;
            }
        });

        return filtered;
    }, [books, searchQuery, selectedTag, selectedTheme, statusFilter, sortOption]);

    return {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        selectedTheme,
        setSelectedTheme,
        statusFilter,
        setStatusFilter,
        sortOption,
        setSortOption,
        allTags,
        allThemes,
        filteredBooks,
        totalCount: books.length,
        filteredCount: filteredBooks.length,
        resetFilters
    };
};

const STATUS_OPTIONS = new Set<BookStatus>(['all', 'yet', 'reading', 'completed']);
const SORT_OPTIONS = new Set<SortOption>(['readDate-newest', 'readDate-oldest', 'rating-high', 'rating-low']);
