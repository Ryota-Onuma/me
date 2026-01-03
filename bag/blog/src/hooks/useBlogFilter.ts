'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { ContentItem } from '@/lib/posts';

// Client-side hook that receives contents as prop
export interface UseBlogFilterResult {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedTag: string | null;
    setSelectedTag: (tag: string | null) => void;
    allTags: string[];
    filteredContents: ContentItem[];
    totalItems: number;
}

/**
 * useBlogFilter - ブログ記事の検索、タグによるフィルタリングを管理する
 */
export const useBlogFilter = (contents: ContentItem[] = []): UseBlogFilterResult => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const selectedTag = searchParams.get('tag');
    const [searchQuery, setSearchQuery] = useState('');

    const setSelectedTag = (tag: string | null) => {
        const newParams = new URLSearchParams(searchParams.toString());
        if (tag) {
            newParams.set('tag', tag);
        } else {
            newParams.delete('tag');
        }
        router.push(`?${newParams.toString()}`);
    };

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        contents.forEach(item => item.tags?.forEach(tag => {
            if (tag && tag.trim()) {
                tags.add(tag);
            }
        }));
        return Array.from(tags).sort();
    }, [contents]);

    const filteredContents = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return contents.filter(item => {
            const matchesSearch = !query ||
                item.title.toLowerCase().includes(query) ||
                (item.description?.toLowerCase().includes(query) ?? false);
            const matchesTag = selectedTag === null || item.tags?.includes(selectedTag);
            return matchesSearch && matchesTag;
        });
    }, [contents, searchQuery, selectedTag]);

    return {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        allTags,
        filteredContents,
        totalItems: contents.length
    };
};
