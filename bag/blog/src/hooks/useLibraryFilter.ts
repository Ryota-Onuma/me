'use client';

import { useState, useMemo } from 'react';
import type { BookItem } from '@/lib/books';

export type BookStatus = 'all' | 'yet' | 'reading' | 'completed';
export type SortOption = 'readDate-newest' | 'readDate-oldest' | 'rating-high' | 'rating-low';

export interface UseLibraryFilterResult {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedTag: string | null;
    setSelectedTag: (tag: string | null) => void;
    statusFilter: BookStatus;
    setStatusFilter: (status: BookStatus) => void;
    sortOption: SortOption;
    setSortOption: (option: SortOption) => void;
    allTags: string[];
    filteredBooks: BookItem[];
    totalCount: number;
    filteredCount: number;
}

/**
 * useLibraryFilter - 書籍の検索、タグ、ステータス、ソートを管理する
 */
export const useLibraryFilter = (books: BookItem[] = []): UseLibraryFilterResult => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<BookStatus>('all');
    const [sortOption, setSortOption] = useState<SortOption>('readDate-newest');

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        books.forEach(book => book.tags.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [books]);

    const filteredBooks = useMemo(() => {
        // Filter
        let filtered = books.filter(book => {
            // Search: title OR author
            const matchesSearch =
                book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                book.author.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = selectedTag === null || book.tags.includes(selectedTag);
            const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
            return matchesSearch && matchesTag && matchesStatus;
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
    }, [books, searchQuery, selectedTag, statusFilter, sortOption]);

    return {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        statusFilter,
        setStatusFilter,
        sortOption,
        setSortOption,
        allTags,
        filteredBooks,
        totalCount: books.length,
        filteredCount: filteredBooks.length
    };
};
