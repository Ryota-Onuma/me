import React from 'react';
import Link from 'next/link';
import type { ContentItem } from '@/lib/posts';
import { ExternalLink } from '@/components/ui/ExternalLink';

interface BlogNavigationProps {
    prevPost: ContentItem | null;
    nextPost: ContentItem | null;
}

export const BlogNavigation: React.FC<BlogNavigationProps> = ({ prevPost, nextPost }) => {
    const renderPostLink = (targetPost: ContentItem, direction: 'prev' | 'next') => {
        const label = direction === 'prev'
            ? `← 前の記事：${targetPost.title}`
            : `次の記事：${targetPost.title} →`;

        const hasInternalPage = targetPost.slug && (targetPost.type === 'internal' || targetPost.hasContent);
        if (hasInternalPage) {
            return (
                <Link href={`/blog/${targetPost.slug}`} className={`retro-post-link is-${direction}`}>
                    {label}
                </Link>
            );
        }

        if (targetPost.url) {
            return (
                <ExternalLink
                    href={targetPost.url}
                    className={`retro-post-link is-${direction}`}
                    showIndicator={false}
                    eventName="external_article_click"
                    eventProperties={{ contentId: targetPost.id }}
                >
                    {label} <small>（外部・新しいタブ）</small>
                </ExternalLink>
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
