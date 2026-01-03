import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { contents, ContentItem } from '../data/contents';
import { parseMarkdownPost, ParsedPost } from '../utils/markdown';

// Vite's way to load all markdown files in the posts directory
const posts: Record<string, string> = import.meta.glob('../content/posts/*.md', { query: '?raw', import: 'default', eager: true });

export interface UseBlogPostResult {
    post: ParsedPost | null;
    isLoading: boolean;
    prevPost: ContentItem | null;
    nextPost: ContentItem | null;
}

/**
 * useBlogPost - ブログ記事の取得と前後の記事の管理を行うカスタムフック
 */
export const useBlogPost = (): UseBlogPostResult => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<ParsedPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Derived data: compute prev/next posts from slug
    const { prevPost, nextPost } = useMemo(() => {
        if (!slug) return { prevPost: null, nextPost: null };
        const currentIndex = contents.findIndex(c => c.slug === slug);
        if (currentIndex === -1) return { prevPost: null, nextPost: null };
        return {
            prevPost: contents[currentIndex - 1] ?? null,
            nextPost: contents[currentIndex + 1] ?? null
        };
    }, [slug]);

    useEffect(() => {
        const loadPost = (): void => {
            setIsLoading(true);
            try {
                const path = `../content/posts/${slug}.md`;
                const rawContent = posts[path];

                if (!rawContent) {
                    console.error('Post not found:', path);
                    setPost(null);
                    return;
                }

                const parsed = parseMarkdownPost(rawContent);
                setPost(parsed);
            } catch (err) {
                console.error('Failed to parse post:', err);
                setPost(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) {
            loadPost();
        } else {
            setIsLoading(false);
        }
    }, [slug]);

    return { post, isLoading, prevPost, nextPost };
};
