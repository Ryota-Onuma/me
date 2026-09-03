export const SITE_DESCRIPTION =
    'データベース、ソフトウェア設計、チーム開発の実務と、考えるための読書をつなぐ個人ナレッジページ。';

// The homepage is intentionally curated instead of treating recency or volume
// as a proxy for importance. Update these IDs when the recommended path changes.
export const HOME_FEATURED_CONTENT_IDS = [
    'postgresql-btree-locality',
    'concrete-abstract-thinking',
    'sansan-english-first',
] as const;

// This is the author's editable focus, not a count-based ranking.
export const HOME_FOCUS_THEME_SLUGS = [
    'database',
    'software-design',
    'thinking',
] as const;
