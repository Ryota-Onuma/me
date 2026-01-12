// Directory paths
export const POSTS_DIRECTORY = 'content/posts';
export const SCRAPS_DIRECTORY = 'content/scraps';
export const BOOKS_DIRECTORY = 'content/books';

// Default assets
export const DEFAULT_THUMBNAIL = '/thumbnails/default_blog.png';
export const DEFAULT_BOOK_COVER = '/books/default_cover.png';

// Colors
export const BACKGROUND_COLOR_LIGHT = '#fafafa';
export const ACCENT_COLOR = '#76b5c5'; // Example accent color derived from UI

// Content limits
export const MAX_RECENT_POSTS = 5;
export const MAX_LATEST_SCRAPS = 3;
export const MAX_DESCRIPTION_LENGTH = 100;

// Regex patterns for markdown processing
export const IMAGE_RESIZE_PATTERN = /^!\[([^\]]*)\]\(([^)]+)\s*=(\d+)\)$/;
export const TIMESTAMP_PATTERN = /^##\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/;
