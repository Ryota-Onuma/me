import React from 'react';
import { ThemeLinks } from '../ui/ThemeLinks';
import { ExternalLink } from '../ui/ExternalLink';

interface ParsedPost {
    title: string;
    date: string;
    tags: string[];
    themes?: string[];
    updated?: string;
    externalUrl?: string;
}

interface BlogHeroProps {
    post: ParsedPost;
}

export const BlogHero: React.FC<BlogHeroProps> = ({ post }) => (
    <header className="retro-detail-hero">
        <h1>{post.title}</h1>
        <p className="retro-card-meta">
            公開日：{post.date}{post.updated && post.updated !== post.date && ` ｜ 更新：${post.updated}`}
            {post.tags.length > 0 && ` ｜ タグ：${post.tags.join(' / ')}`}
        </p>
        <ThemeLinks themes={post.themes} />
        {post.externalUrl && (
            <p><ExternalLink href={post.externalUrl} eventName="external_article_click">元記事を外部サイトで読む</ExternalLink></p>
        )}
    </header>
);
