import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { contents } from '../data/contents';

const ITEMS_PER_PAGE = 9;

/**
 * useBlogFilter - ブログ記事のプロンプト、タグによるフィルタリングとページネーションを管理する
 */
export const useBlogFilter = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        contents.forEach(item => item.tags?.forEach(tag => tags.add(tag)));
        return Array.from(tags).slice(0, 6);
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

    const totalPages = Math.ceil(filteredContents.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedContents = filteredContents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (currentPage !== 1) {
            setSearchParams({ page: '1' });
        }
    }, [searchQuery, selectedTag]);

    const goToPage = (page: number): void => {
        if (page >= 1 && page <= totalPages) {
            setSearchParams({ page: page.toString() });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return {
        currentPage,
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        allTags,
        filteredContents,
        paginatedContents,
        totalPages,
        goToPage
    };
};
