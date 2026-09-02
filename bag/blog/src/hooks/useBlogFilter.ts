'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { ContentItem } from '@/lib/posts';
import { normalizeTheme } from '@/lib/themes';

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
}

/**
 * useBlogFilter - ブログ記事の検索、タグによるフィルタリングを管理する
 */
export const useBlogFilter = (contents: ContentItem[] = []): UseBlogFilterResult => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const selectedTag = searchParams.get('tag');
    const rawTheme = searchParams.get('theme');
    const selectedTheme = rawTheme ? (normalizeTheme(rawTheme) || rawTheme) : null;
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

    const setSelectedTheme = (theme: string | null) => {
        const newParams = new URLSearchParams(searchParams.toString());
        if (theme) newParams.set('theme', theme);
        else newParams.delete('theme');
        router.push(`?${newParams.toString()}`);
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
        totalItems: contents.length
    };
};
