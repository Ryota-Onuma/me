'use client';

import { useState, useMemo } from 'react';
import type { ScrapItem } from '@/lib/scraps';
import { normalizeTheme } from '@/lib/themes';

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
}

/**
 * useScrapFilter - スクラップの検索、タグ、ステータスによるフィルタリングを管理する
 */
export const useScrapFilter = (scraps: ScrapItem[] = []): UseScrapFilterResult => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<ScrapStatus>('all');
    const [selectedTheme, setSelectedThemeState] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        const value = new URLSearchParams(window.location.search).get('theme');
        return value ? (normalizeTheme(value) || value) : null;
    });

    const setSelectedTheme = (theme: string | null) => {
        setSelectedThemeState(theme);
        if (typeof window === 'undefined') return;
        const newParams = new URLSearchParams(window.location.search);
        if (theme) newParams.set('theme', theme);
        else newParams.delete('theme');
        const query = newParams.toString();
        window.history.pushState({}, '', query ? `?${query}` : window.location.pathname);
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
        filteredCount: filteredScraps.length
    };
};
