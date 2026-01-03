import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { contents, ContentItem } from '../data/contents';

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
export const useBlogFilter = (): UseBlogFilterResult => {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedTag = searchParams.get('tag');
    const [searchQuery, setSearchQuery] = useState('');

    const setSelectedTag = (tag: string | null) => {
        const newParams = new URLSearchParams(searchParams);
        if (tag) {
            newParams.set('tag', tag);
        } else {
            newParams.delete('tag');
        }
        setSearchParams(newParams);
    };

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        contents.forEach(item => item.tags?.forEach(tag => {
            if (tag && tag.trim()) {
                tags.add(tag);
            }
        }));
        return Array.from(tags).sort();
    }, []);

    const filteredContents = useMemo(() => {
        return contents.filter(item => {
            const matchesSearch = !searchQuery ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = !selectedTag || item.tags?.includes(selectedTag);
            return matchesSearch && matchesTag;
        });
    }, [searchQuery, selectedTag]);

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
