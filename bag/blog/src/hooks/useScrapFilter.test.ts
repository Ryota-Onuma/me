import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrapFilter } from './useScrapFilter';
import type { ScrapItem } from '@/lib/scraps';

const navigation = vi.hoisted(() => ({
    pathname: '/scrap',
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
    beforeEach(() => {
        navigation.query = '';
        window.history.replaceState(null, '', navigation.pathname);
        navigation.push.mockReset();
        navigation.replace.mockReset();
        navigation.push.mockImplementation(applyNavigation);
        navigation.replace.mockImplementation(applyNavigation);
    });

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
        const { result, rerender } = renderHook(() => useScrapFilter(mockScraps));

        act(() => {
            result.current.setSearchQuery('react');
        });
        rerender();

        expect(result.current.filteredScraps).toHaveLength(1);
        expect(result.current.filteredScraps[0].title).toBe('React Hooks Guide');
        expect(window.location.pathname + window.location.search).toBe('/scrap?q=react');

        act(() => {
            result.current.setSearchQuery('non-existent');
        });
        rerender();

        expect(result.current.filteredScraps).toHaveLength(0);
    });

    it('should find scraps by a partial tag query', () => {
        const { result, rerender } = renderHook(() => useScrapFilter(mockScraps));

        act(() => {
            result.current.setSearchQuery('BACK');
        });
        rerender();

        expect(result.current.filteredScraps).toHaveLength(1);
        expect(result.current.filteredScraps[0].title).toBe('Legacy Project');
    });

    it('should filter by tag', () => {
        const { result, rerender } = renderHook(() => useScrapFilter(mockScraps));

        act(() => {
            result.current.setSelectedTag('testing');
        });
        rerender();

        expect(result.current.filteredScraps).toHaveLength(1);
        expect(result.current.filteredScraps[0].tags).toContain('testing');

        act(() => {
            result.current.setSelectedTag(null);
        });
        rerender();

        expect(result.current.filteredScraps).toHaveLength(3);
    });

    it('should filter by status', () => {
        const { result, rerender } = renderHook(() => useScrapFilter(mockScraps));

        act(() => {
            result.current.setStatusFilter('open');
        });
        rerender();

        expect(result.current.filteredScraps).toHaveLength(2);
        expect(result.current.filteredScraps.every(s => s.status === 'open')).toBe(true);

        act(() => {
            result.current.setStatusFilter('closed');
        });
        rerender();

        expect(result.current.filteredScraps).toHaveLength(1);
        expect(result.current.filteredScraps[0].status).toBe('closed');
    });

    it('should combine multiple filters', () => {
        const { result, rerender } = renderHook(() => useScrapFilter(mockScraps));

        act(() => result.current.setSearchQuery('Guide'));
        rerender();
        act(() => result.current.setSelectedTag('react'));
        rerender();
        act(() => result.current.setStatusFilter('open'));
        rerender();

        expect(result.current.filteredScraps).toHaveLength(1);
        expect(result.current.filteredScraps[0].title).toBe('React Hooks Guide');

        act(() => {
            result.current.setStatusFilter('closed');
        });
        rerender();

        expect(result.current.filteredScraps).toHaveLength(0);
    });

    it('should handle empty scraps input', () => {
        const { result } = renderHook(() => useScrapFilter([]));

        expect(result.current.allTags).toEqual([]);
        expect(result.current.filteredScraps).toHaveLength(0);
        expect(result.current.totalCount).toBe(0);
        expect(result.current.filteredCount).toBe(0);
    });

    it('uses direct URL state and follows history changes', () => {
        navigation.query = 'q=react&tag=frontend&status=open';
        const { result, rerender } = renderHook(() => useScrapFilter(mockScraps));

        expect(result.current.searchQuery).toBe('react');
        expect(result.current.selectedTag).toBe('frontend');
        expect(result.current.statusFilter).toBe('open');
        expect(result.current.filteredScraps.map(scrap => scrap.id)).toEqual(['1']);

        navigation.query = 'status=closed';
        rerender();
        expect(result.current.searchQuery).toBe('');
        expect(result.current.selectedTag).toBeNull();
        expect(result.current.filteredScraps.map(scrap => scrap.id)).toEqual(['3']);
    });

    it('resets every supported filter in one history entry', () => {
        navigation.query = 'q=react&theme=Learning&tag=frontend&status=open&sort=rating-high&ref=home';
        const { result } = renderHook(() => useScrapFilter(mockScraps));

        act(() => result.current.resetFilters());

        expect(window.location.pathname + window.location.search).toBe('/scrap?ref=home');
    });
});
