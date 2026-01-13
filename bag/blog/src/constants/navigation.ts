/**
 * Shared navigation configuration
 * Used across all pages to ensure consistent navigation
 */
export const NAV_LINKS = ['about', 'blog', 'scrap', 'library'] as const;

export type NavLink = typeof NAV_LINKS[number];
