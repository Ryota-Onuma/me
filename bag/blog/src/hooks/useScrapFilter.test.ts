import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrapFilter } from './useScrapFilter';
import type { ScrapItem } from '@/lib/scraps';

const mockScraps: ScrapItem[] = [
    {
        id: '1',
        slug: 'scrap-1',
        title: 'React Hooks Guide',
        emoji: '⚛️',
        status: 'open',
        date: '2026-01-01',
        tags: ['react', 'frontend'],
        threadCount: 2,
        isThreaded: true,
        lastUpdated: '2026-01-01'
    },
    {
        id: '2',
        slug: 'scrap-2',
        title: 'Vitest Setup',
        emoji: '🧪',
        status: 'open',
        date: '2026-01-02',
        tags: ['testing'],
        threadCount: 1,
        isThreaded: true,
        lastUpdated: '2026-01-02'
    },
    {
        id: '3',
        slug: 'scrap-3',
        title: 'Legacy Project',
        emoji: '📦',
        status: 'closed',
        date: '2025-12-31',
        tags: ['legacy', 'backend'],
        threadCount: 5,
        isThreaded: true,
        lastUpdated: '2025-12-31'
    }
];

describe('useScrapFilter', () => {
    it('should initialize with default values', () => {
        const { result } = renderHook(() => useScrapFilter(mockScraps));

        expect(result.current.searchQuery).toBe('');
        expect(result.current.selectedTag).toBeNull();
        expect(result.current.statusFilter).toBe('all');
        expect(result.current.allTags).toEqual(['backend', 'frontend', 'legacy', 'react', 'testing']);
        expect(result.current.filteredScraps).toHaveLength(3);
        expect(result.current.totalCount).toBe(3);
        expect(result.current.filteredCount).toBe(3);
    });

    it('should filter by search query', () => {
        const { result } = renderHook(() => useScrapFilter(mockScraps));

        act(() => {
            result.current.setSearchQuery('react');
        });

        expect(result.current.filteredScraps).toHaveLength(1);
        expect(result.current.filteredScraps[0].title).toBe('React Hooks Guide');

        act(() => {
            result.current.setSearchQuery('non-existent');
        });

        expect(result.current.filteredScraps).toHaveLength(0);
    });

    it('should find scraps by a partial tag query', () => {
        const { result } = renderHook(() => useScrapFilter(mockScraps));

        act(() => {
            result.current.setSearchQuery('BACK');
        });

        expect(result.current.filteredScraps).toHaveLength(1);
        expect(result.current.filteredScraps[0].title).toBe('Legacy Project');
    });

    it('should filter by tag', () => {
        const { result } = renderHook(() => useScrapFilter(mockScraps));

        act(() => {
            result.current.setSelectedTag('testing');
        });

        expect(result.current.filteredScraps).toHaveLength(1);
        expect(result.current.filteredScraps[0].tags).toContain('testing');

        act(() => {
            result.current.setSelectedTag(null);
        });

        expect(result.current.filteredScraps).toHaveLength(3);
    });

    it('should filter by status', () => {
        const { result } = renderHook(() => useScrapFilter(mockScraps));

        act(() => {
            result.current.setStatusFilter('open');
        });

        expect(result.current.filteredScraps).toHaveLength(2);
        expect(result.current.filteredScraps.every(s => s.status === 'open')).toBe(true);

        act(() => {
            result.current.setStatusFilter('closed');
        });

        expect(result.current.filteredScraps).toHaveLength(1);
        expect(result.current.filteredScraps[0].status).toBe('closed');
    });

    it('should combine multiple filters', () => {
        const { result } = renderHook(() => useScrapFilter(mockScraps));

        act(() => {
            result.current.setSearchQuery('Guide');
            result.current.setSelectedTag('react');
            result.current.setStatusFilter('open');
        });

        expect(result.current.filteredScraps).toHaveLength(1);
        expect(result.current.filteredScraps[0].title).toBe('React Hooks Guide');

        act(() => {
            result.current.setStatusFilter('closed');
        });

        expect(result.current.filteredScraps).toHaveLength(0);
    });

    it('should handle empty scraps input', () => {
        const { result } = renderHook(() => useScrapFilter([]));

        expect(result.current.allTags).toEqual([]);
        expect(result.current.filteredScraps).toHaveLength(0);
        expect(result.current.totalCount).toBe(0);
        expect(result.current.filteredCount).toBe(0);
    });
});
