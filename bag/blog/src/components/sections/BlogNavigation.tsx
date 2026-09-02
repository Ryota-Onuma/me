'use client';

import React from 'react';
import Link from 'next/link';
import type { ContentItem } from '@/lib/posts';

interface BlogNavigationProps {
    prevPost: ContentItem | null;
    nextPost: ContentItem | null;
}

export const BlogNavigation: React.FC<BlogNavigationProps> = ({ prevPost, nextPost }) => {
    const renderPostLink = (targetPost: ContentItem, direction: 'prev' | 'next') => {
        const label = direction === 'prev'
            ? `← 前の記事：${targetPost.title}`
            : `次の記事：${targetPost.title} →`;

        if (targetPost.type === 'internal' && targetPost.slug) {
            return (
                <Link href={`/blog/${targetPost.slug}`} className={`retro-post-link is-${direction}`}>
                    {label}
                </Link>
            );
        }

        if (targetPost.url) {
            return (
                <a
                    href={targetPost.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`retro-post-link is-${direction}`}
                >
                    {label} <small>（外部・新しいタブ）</small>
                </a>
            );
        }

        return null;
    };

    return (
        <nav className="retro-post-navigation" aria-label="記事間の移動">
            {prevPost ? (
                renderPostLink(prevPost, 'prev')
            ) : <span />}

            {nextPost && renderPostLink(nextPost, 'next')}
        </nav>
    );
};
