'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ScrapItem } from '@/lib/scraps';
import { trackAnalyticsEvent } from '@/lib/analytics';
import { normalizeTheme } from '@/lib/themes';
import { useSynchronizedSearchParams } from './useSynchronizedSearchParams';

export type ScrapStatus = 'all' | 'open' | 'closed' | 'growing' | 'evergreen' | 'archived' | 'published';

export interface UseScrapFilterResult {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedTag: string | null;
    setSelectedTag: (tag: string | null) => void;
    selectedTheme: string | null;
    setSelectedTheme: (theme: string | null) => void;
    statusFilter: ScrapStatus;
    setStatusFilter: (status: ScrapStatus) => void;
    allTags: string[];
    allThemes: string[];
    filteredScraps: ScrapItem[];
    totalCount: number;
    filteredCount: number;
    resetFilters: () => void;
}

/**
 * useScrapFilter - スクラップの検索、タグ、ステータスによるフィルタリングを管理する
 */
export const useScrapFilter = (scraps: ScrapItem[] = []): UseScrapFilterResult => {
    const searchParams = useSynchronizedSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchQuery = searchParams.get('q') ?? '';
    const selectedTag = searchParams.get('tag');
    const rawTheme = searchParams.get('theme');
    const selectedTheme = rawTheme ? (normalizeTheme(rawTheme) || rawTheme) : null;
    const rawStatus = searchParams.get('status');
    const statusFilter: ScrapStatus = rawStatus && STATUS_OPTIONS.has(rawStatus as ScrapStatus)
        ? rawStatus as ScrapStatus
        : 'all';

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
        trackAnalyticsEvent('filter_use', { collection: 'scrap', filter: 'q', active: Boolean(query) });
        updateParams(params => {
            if (query) params.set('q', query);
            else params.delete('q');
        }, 'replace');
    };

    const setSelectedTag = (tag: string | null) => {
        trackAnalyticsEvent('filter_use', { collection: 'scrap', filter: 'tag', active: Boolean(tag) });
        updateParams(params => {
            if (tag) params.set('tag', tag);
            else params.delete('tag');
        });
    };

    const setSelectedTheme = (theme: string | null) => {
        trackAnalyticsEvent('filter_use', { collection: 'scrap', filter: 'theme', active: Boolean(theme) });
        updateParams(params => {
            if (theme) params.set('theme', theme);
            else params.delete('theme');
        });
    };

    const setStatusFilter = (status: ScrapStatus) => {
        trackAnalyticsEvent('filter_use', { collection: 'scrap', filter: 'status', active: status !== 'all' });
        updateParams(params => {
            if (status === 'all') params.delete('status');
            else params.set('status', status);
        });
    };

    const resetFilters = () => {
        trackAnalyticsEvent('filter_use', { collection: 'scrap', filter: 'reset', active: false });
        updateParams(params => {
            ['q', 'theme', 'tag', 'status', 'sort'].forEach(key => params.delete(key));
        });
    };

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        scraps.forEach(scrap => scrap.tags.filter(tag => !normalizeTheme(tag)).forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [scraps]);

    const allThemes = useMemo(() => Array.from(new Set(scraps.flatMap(scrap => scrap.themes || []))).sort(), [scraps]);

    const filteredScraps = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();

        return scraps.filter(scrap => {
            const matchesSearch = !query ||
                scrap.title.toLowerCase().includes(query) ||
                scrap.tags.some(tag => tag.toLowerCase().includes(query));
            const matchesTag = selectedTag === null || scrap.tags.includes(selectedTag);
            const matchesTheme = selectedTheme === null || scrap.themes?.includes(selectedTheme);
            const matchesStatus = statusFilter === 'all' || scrap.status === statusFilter;
            return matchesSearch && matchesTag && matchesTheme && matchesStatus;
        });
    }, [scraps, searchQuery, selectedTag, selectedTheme, statusFilter]);

    return {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        selectedTheme,
        setSelectedTheme,
        statusFilter,
        setStatusFilter,
        allTags,
        allThemes,
        filteredScraps,
        totalCount: scraps.length,
        filteredCount: filteredScraps.length,
        resetFilters
    };
};

const STATUS_OPTIONS = new Set<ScrapStatus>(['all', 'open', 'closed', 'growing', 'evergreen', 'archived', 'published']);
