export const SITE_DESCRIPTION = '技術のメモと、読んだ本。';
export const SITE_TAGLINE = SITE_DESCRIPTION;

export const ARCHIVE_SECTIONS = {
    about: { href: '/', navLabel: 'ホーム', title: 'ホーム' },
    blog: { href: '/blog', navLabel: '技術ノート', title: '技術ノート' },
    library: { href: '/library', navLabel: '本棚', title: '読書記録' },
    themes: { href: '/themes', navLabel: '索引', title: 'テーマ' },
} as const;

export type ArchiveSectionKey = keyof typeof ARCHIVE_SECTIONS;
