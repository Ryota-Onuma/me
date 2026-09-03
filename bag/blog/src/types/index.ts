/**
 * Centralized type definitions for the blog application
 */

// ============================================================================
// Post Types
// ============================================================================

export interface PostFrontmatter {
    id?: string;
    title: string;
    category?: string;
    description?: string;
    date: string;
    tags: string[];
    thumbnail?: string;
    url?: string;
    external_url?: string;
    /** Shared vocabulary used to connect posts, scraps, and books. */
    themes?: string[];
    /** Slugs of scraps/books that informed this post. */
    sourceScraps?: string[];
    sourceBooks?: string[];
    /** Slugs of related content, regardless of type. */
    related?: string[];
    derivedFrom?: string[];
    /** Last meaningful edit (date is the original publication date). */
    updated?: string;
    /** Available by direct URL for visual regression tests, but hidden from public indexes. */
    internalOnly?: boolean;
}

export interface Post {
    slug: string;
    frontmatter: PostFrontmatter;
    content: string;
}

export interface ContentItem {
    id: string;
    type: 'external' | 'internal';
    title: string;
    category: string;
    description: string;
    date: string;
    tags: string[];
    themes?: string[];
    thumbnail: string;
    url?: string;
    slug?: string;
    updated?: string;
    sourceScraps?: string[];
    sourceBooks?: string[];
    related?: string[];
    derivedFrom?: string[];
    hasContent?: boolean;
}

// ============================================================================
// Scrap Types
// ============================================================================

export interface ScrapFrontmatter {
    title: string;
    date: string;
    status: 'open' | 'closed' | 'growing' | 'evergreen' | 'archived' | 'published';
    tags: string[];
    themes?: string[];
    updated?: string;
    related?: string[];
    sourceBooks?: string[];
    emoji?: string;
    internalOnly?: boolean;
}

export interface ScrapThread {
    id: string;
    timestamp?: string;
    content: string;
}

export interface Scrap {
    slug: string;
    frontmatter: ScrapFrontmatter;
    threads: ScrapThread[];
    isThreaded: boolean;
    rawContent: string;
    updatedAt?: string;
}

export interface ScrapItem {
    id: string;
    slug: string;
    title: string;
    emoji: string;
    status: 'open' | 'closed' | 'growing' | 'evergreen' | 'archived' | 'published';
    date: string;
    tags: string[];
    themes?: string[];
    threadCount: number;
    isThreaded: boolean;
    lastUpdated: string;
    related?: string[];
    sourceBooks?: string[];
}

// ============================================================================
// Markdown Processing Types
// ============================================================================

export interface DirectiveData {
    hName?: string;
    hProperties?: Record<string, string | number | boolean>;
}

export interface DirectiveNode {
    name: string;
    attributes?: Record<string, string | null | undefined> | null;
    children?: unknown[];
    data?: DirectiveData;
}

// ============================================================================
// Component Prop Types
// ============================================================================

export interface LinkCardProps {
    url: string;
}

export interface EmbedBlockProps {
    type: string;
    id: string;
}

export interface AlertBlockProps {
    type: 'info' | 'warning' | 'success' | 'error';
    children: React.ReactNode;
}

export interface CodeBlockProps {
    children?: React.ReactNode;
    className?: string;
    inline?: boolean;
    node?: unknown; // From react-markdown, intentionally unknown
}

export interface MermaidProps {
    chart: string;
}

// ============================================================================
// Error Types
// ============================================================================

export type ContentType = 'post' | 'scrap';

export class ContentLoadError extends Error {
    constructor(
        public fileName: string,
        public contentType: ContentType,
        public originalError: unknown
    ) {
        super(`Failed to load ${contentType}: ${fileName}`);
        this.name = 'ContentLoadError';
    }
}

export class FrontmatterParseError extends Error {
    constructor(
        public fileName: string,
        public originalError: unknown
    ) {
        super(`Failed to parse frontmatter in: ${fileName}`);
        this.name = 'FrontmatterParseError';
    }
}
