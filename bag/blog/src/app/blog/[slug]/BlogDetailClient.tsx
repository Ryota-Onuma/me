import type { OGPData } from '@/lib/prefetchOGP';

import { Header, Footer } from '@/components/layout';
import { MarkdownContent } from '@/components/markdown/MarkdownContent';
import { TableOfContents } from '@/components/markdown/TableOfContents';
import { BlogHero } from '@/components/sections/BlogHero';
import { BlogNavigation } from '@/components/sections/BlogNavigation';
import { RelatedContentSection } from '@/components/sections/RelatedContentSection';
import type { ContentItem } from '@/lib/posts';




interface ParsedPost {
    accession: string;
    title: string;
    date: string;
    tags: string[];
    content: string;
    thumbnail?: string;
    externalUrl?: string;
    themes?: string[];
    updated?: string;
}

interface BlogDetailClientProps {
    post: ParsedPost;
    prevPost: ContentItem | null;
    nextPost: ContentItem | null;
    ogpDataMap?: Record<string, OGPData>;
    relatedContent?: import('@/lib/content').UnifiedContent[];
}

export function BlogDetailClient({ post, prevPost, nextPost, ogpDataMap, relatedContent = [] }: BlogDetailClientProps) {
    return (
        <div className="site-shell">
            <Header backLink="/blog" backLabel="技術ノート一覧へ" activePath="/blog" />
            <main id="main-content" className="retro-detail-page" tabIndex={-1}>
                <BlogHero post={post} />
                <div className="retro-article-wrap">
                    <TableOfContents content={post.content} />
                    <article className="retro-article">
                        <MarkdownContent content={post.content} ogpDataMap={ogpDataMap} />
                    </article>
                    <BlogNavigation prevPost={prevPost} nextPost={nextPost} />
                    <RelatedContentSection contents={relatedContent} />
                </div>
            </main>
            <Footer />
        </div>
    );
}
