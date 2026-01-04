'use client';

import { useState, useMemo } from 'react';
import type { ScrapItem } from '@/lib/scraps';

export type ScrapStatus = 'all' | 'open' | 'closed';

export interface UseScrapFilterResult {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedTag: string | null;
    setSelectedTag: (tag: string | null) => void;
    statusFilter: ScrapStatus;
    setStatusFilter: (status: ScrapStatus) => void;
    allTags: string[];
    filteredScraps: ScrapItem[];
    totalItems: number;
}

/**
 * useScrapFilter - スクラップの検索、タグ、ステータスによるフィルタリングを管理する
 */
export const useScrapFilter = (scraps: ScrapItem[] = []): UseScrapFilterResult => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<ScrapStatus>('all');

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        scraps.forEach(scrap => scrap.tags.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [scraps]);

    const filteredScraps = useMemo(() => {
        return scraps.filter(scrap => {
            const matchesSearch = scrap.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = selectedTag === null || scrap.tags.includes(selectedTag);
            const matchesStatus = statusFilter === 'all' || scrap.status === statusFilter;
            return matchesSearch && matchesTag && matchesStatus;
        });
    }, [scraps, searchQuery, selectedTag, statusFilter]);

    return {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        statusFilter,
        setStatusFilter,
        allTags,
        filteredScraps,
        totalItems: scraps.length
    };
};
