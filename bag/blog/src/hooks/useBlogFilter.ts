'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ContentItem } from '@/lib/posts';
import { trackAnalyticsEvent } from '@/lib/analytics';
import { normalizeTheme } from '@/lib/themes';
import { useSynchronizedSearchParams } from './useSynchronizedSearchParams';

// Client-side hook that receives contents as prop
export interface UseBlogFilterResult {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedTag: string | null;
    setSelectedTag: (tag: string | null) => void;
    selectedTheme: string | null;
    setSelectedTheme: (theme: string | null) => void;
    allTags: string[];
    allThemes: string[];
    filteredContents: ContentItem[];
    totalItems: number;
    resetFilters: () => void;
}

/**
 * useBlogFilter - ブログ記事の検索、タグによるフィルタリングを管理する
 */
export const useBlogFilter = (contents: ContentItem[] = []): UseBlogFilterResult => {
    const searchParams = useSynchronizedSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchQuery = searchParams.get('q') ?? '';
    const selectedTag = searchParams.get('tag');
    const rawTheme = searchParams.get('theme');
    const selectedTheme = rawTheme ? (normalizeTheme(rawTheme) || rawTheme) : null;

    const updateParams = useCallback((
        update: (params: URLSearchParams) => void,
        method: 'push' | 'replace' = 'push'
    ) => {
        const newParams = new URLSearchParams(searchParams.toString());
        update(newParams);
        const query = newParams.toString();
        const href = query ? `${pathname}?${query}` : pathname;
        // Archive state is client-side. Native history keeps typing and facet
        // changes from queuing a full App Router navigation while still
        // syncing useSearchParams and shareable URLs.
        if (typeof window !== 'undefined') {
            window.history[method === 'replace' ? 'replaceState' : 'pushState'](window.history.state, '', href);
            window.dispatchEvent(new PopStateEvent('popstate'));
            return;
        }
        router[method](href, { scroll: false });
    }, [pathname, router, searchParams]);

    const setSearchQuery = (query: string) => {
        trackAnalyticsEvent('filter_use', { collection: 'blog', filter: 'q', active: Boolean(query) });
        updateParams(params => {
            if (query) params.set('q', query);
            else params.delete('q');
        }, 'replace');
    };

    const setSelectedTag = (tag: string | null) => {
        trackAnalyticsEvent('filter_use', { collection: 'blog', filter: 'tag', active: Boolean(tag) });
        updateParams(newParams => {
            if (tag) {
                newParams.set('tag', tag);
            } else {
                newParams.delete('tag');
            }
        });
    };

    const setSelectedTheme = (theme: string | null) => {
        trackAnalyticsEvent('filter_use', { collection: 'blog', filter: 'theme', active: Boolean(theme) });
        updateParams(newParams => {
            if (theme) newParams.set('theme', theme);
            else newParams.delete('theme');
        });
    };

    const resetFilters = () => {
        trackAnalyticsEvent('filter_use', { collection: 'blog', filter: 'reset', active: false });
        updateParams(params => {
            ['q', 'theme', 'tag', 'status', 'sort'].forEach(key => params.delete(key));
        });
    };

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        contents.forEach(item => item.tags?.forEach(tag => {
            if (tag && tag.trim() && !normalizeTheme(tag)) {
                tags.add(tag);
            }
        }));
        return Array.from(tags).sort();
    }, [contents]);

    const allThemes = useMemo(() => Array.from(new Set(contents.flatMap(item => item.themes || []))).sort(), [contents]);

    const filteredContents = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return contents.filter(item => {
            const matchesSearch = !query ||
                item.title.toLowerCase().includes(query) ||
                (item.description?.toLowerCase().includes(query) ?? false) ||
                (item.tags?.some(tag => tag.toLowerCase().includes(query)) ?? false);
            const matchesTag = selectedTag === null || item.tags?.includes(selectedTag);
            const matchesTheme = selectedTheme === null || item.themes?.includes(selectedTheme);
            return matchesSearch && matchesTag && matchesTheme;
        });
    }, [contents, searchQuery, selectedTag, selectedTheme]);

    return {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        selectedTheme,
        setSelectedTheme,
        allTags,
        allThemes,
        filteredContents,
        totalItems: contents.length,
        resetFilters
    };
};
