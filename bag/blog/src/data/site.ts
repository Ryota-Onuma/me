export const SITE_DESCRIPTION =
    'データベース、ソフトウェア設計、チーム開発の実務と、考えるための読書をつなぐ個人ナレッジページ。';

export const SITE_TAGLINE = '技術と読書、考え途中の紙片を収める個人資料室。';

export const ARCHIVE_SECTIONS = {
    about: {
        href: '/',
        navLabel: '入口',
        title: '入口',
        subtitle: '資料室の案内',
        accent: '#315ea8',
        illustration: '/illustrations/archive-hero.png',
        accessionPrefix: 'EN',
    },
    blog: {
        href: '/blog',
        navLabel: '技術ノート',
        title: '技術ノート',
        subtitle: '整理した記事',
        accent: '#315ea8',
        illustration: '/illustrations/technical-notes.png',
        accessionPrefix: 'TN',
    },
    scrap: {
        href: '/scrap',
        navLabel: '雑記帳',
        title: '雑記帳',
        subtitle: '書きかけのメモ',
        accent: '#b34a42',
        illustration: '/illustrations/scrap-notes.png',
        accessionPrefix: 'SC',
    },
    library: {
        href: '/library',
        navLabel: '本棚',
        title: '読書記録',
        subtitle: '読書記録',
        accent: '#3f7b54',
        illustration: '/illustrations/bookshelf.png',
        accessionPrefix: 'BK',
    },
    themes: {
        href: '/themes',
        navLabel: '索引',
        title: 'テーマ',
        subtitle: '横断テーマ',
        accent: '#7b5b95',
        illustration: '/illustrations/theme-index.png',
        accessionPrefix: 'IX',
    },
} as const;

export type ArchiveSectionKey = keyof typeof ARCHIVE_SECTIONS;

export const formatAccessionNumber = (prefix: string, index: number) =>
    `${prefix}-${String(index + 1).padStart(3, '0')}`;

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
