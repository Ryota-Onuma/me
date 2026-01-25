/**
 * Public API for content management
 * This barrel export defines the public interface for the lib module
 */

// Post-related exports
export { getAllPosts, getPostBySlug, getPostSlugs, getAllContents, getAdjacentPosts } from './posts';
export type { Post, PostFrontmatter, ContentItem } from './posts';

// Scrap-related exports
export { getAllScraps, getScrapBySlug, getScrapSlugs, getAllScrapItems } from './scraps';
export type { Scrap, ScrapFrontmatter, ScrapThread, ScrapItem } from './scraps';

// Book-related exports
export { getAllBooks, getBookBySlug, getBookSlugs, getAllBookItems } from './books';
export type { Book, BookFrontmatter, BookItem } from './books';

// Constants
export {
    POSTS_DIRECTORY,
    SCRAPS_DIRECTORY,
    BOOKS_DIRECTORY,
    DEFAULT_THUMBNAIL,
    DEFAULT_BOOK_COVER,
    MAX_RECENT_POSTS,
    MAX_LATEST_SCRAPS,
} from './constants';

// Markdown processing (public API only)
export { processMarkdownContent } from './markdownProcessor';

// Note: remarkCustomDirectives is internal implementation and not exported
// Note: Error types and utilities are re-exported from @/types
