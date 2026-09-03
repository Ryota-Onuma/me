/**
 * Shared vocabulary for the public notebook.
 *
 * Markdown may use either a canonical slug (recommended) or one of the
 * aliases below.  Existing `tags` remain useful metadata; when `themes` is
 * absent we may infer a small, stable set from legacy tags and titles. Public
 * content is required to declare themes explicitly by content validation.
 */

export interface ThemeDefinition {
    slug: string;
    label: string;
    description: string;
    aliases: string[];
}

export const THEME_DEFINITIONS: ThemeDefinition[] = [
    {
        slug: 'database',
        label: 'Database',
        description: 'データベース、検索、SQLの設計と仕組み',
        aliases: ['database', 'databases', 'db', 'postgresql', 'postgres', 'sql', 'elasticsearch', 'hasura', 'データベース', '検索'],
    },
    {
        slug: 'english',
        label: 'English',
        description: '英語学習、シャドーイング、チームでの英語',
        aliases: ['english', '英語', 'shadowing', 'シャドーイング', 'english first'],
    },
    {
        slug: 'ai',
        label: 'AI',
        description: 'AI、LLM、プロンプトを試しながら考える',
        aliases: ['ai', '人工知能', 'llm', 'claude', 'prompt', 'prompt engineering', 'プロンプト', '生成ai'],
    },
    {
        slug: 'software-design',
        label: 'Software Design',
        description: '設計、アーキテクチャ、コードの分割と結合',
        aliases: ['software design', 'software-design', 'design', 'architecture', 'clean architecture', 'ddd', 'domain driven design', 'domain-driven design', 'microservices', 'oauth', 'ソフトウェア設計', 'アーキテクチャ', 'ドメイン駆動設計', '結合'],
    },
    {
        slug: 'team-development',
        label: 'Team Development',
        description: 'チームで開発するための計画、対話、仕組み',
        aliases: ['team development', 'team-development', 'team', 'agile', 'planning', 'refinement', 'チーム開発', 'アジャイル', 'プランニング', 'リファイメント'],
    },
    {
        slug: 'thinking',
        label: 'Thinking',
        description: '具体と抽象、論点、コミュニケーションについて考える',
        aliases: ['thinking', 'thought', '思考', '思考法', '抽象化', '具体', '抽象', '論点', 'コミュニケーション', 'メタ思考'],
    },
    {
        slug: 'productivity',
        label: 'Productivity',
        description: '仕事の進め方、時間の使い方、学び方',
        aliases: ['productivity', 'time management', 'reading', '仕事術', '生産性', '時間管理', '読書術'],
    },
    {
        slug: 'learning',
        label: 'Learning',
        description: '学習の途中に残す実験、練習、理解の足跡',
        aliases: ['learning', 'study', 'tutorial', '学習', '勉強', '実験', '練習'],
    },
];

const byAlias = new Map<string, string>();
for (const definition of THEME_DEFINITIONS) {
    byAlias.set(definition.slug, definition.slug);
    for (const alias of definition.aliases) {
        byAlias.set(alias.trim().toLocaleLowerCase(), definition.slug);
    }
}

const SOURCE_OR_MEDIA_TAGS = new Set([
    'book',
    'audible',
    'zenn',
    'バイセルテックブログ',
    'sansan tech blog',
]);

export function isMediaTag(value: string): boolean {
    return SOURCE_OR_MEDIA_TAGS.has(normalize(value));
}

const normalize = (value: string): string => value.trim().toLocaleLowerCase();

const containsAlias = (haystack: string, alias: string): boolean => {
    const normalized = alias.toLocaleLowerCase();
    if (/^[a-z0-9]{1,3}$/.test(normalized)) {
        return new RegExp(`(^|[^a-z0-9])${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(haystack);
    }
    return haystack.includes(normalized);
};

/** Convert a frontmatter value into a known theme slug when possible. */
export function normalizeTheme(value: string): string | null {
    const normalized = normalize(value);
    if (!normalized) return null;
    return byAlias.get(normalized) ?? null;
}

/**
 * Resolve explicit themes first, then infer from legacy tags/title/category.
 * Unknown explicit values are rejected by content validation and omitted here.
 */
export function resolveThemes(input: {
    themes?: unknown;
    tags?: unknown;
    title?: string;
    category?: string;
}): string[] {
    const explicitValues = Array.isArray(input.themes)
        ? input.themes
        : typeof input.themes === 'string' ? [input.themes] : [];
    const tagValues = Array.isArray(input.tags)
        ? input.tags
        : typeof input.tags === 'string' ? [input.tags] : [];
    const values = explicitValues
        .concat(explicitValues.length ? [] : tagValues)
        .filter((value): value is string => typeof value === 'string');
    const haystack = [input.title, input.category, ...tagValues]
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLocaleLowerCase();
    const slugs = new Set<string>();
    for (const value of values) {
        const slug = normalizeTheme(value);
        if (slug) slugs.add(slug);
    }
    // Explicit themes are authoritative, but adding inferred themes from the
    // title keeps existing records discoverable when they only had source tags.
    if (!explicitValues.length) {
        for (const definition of THEME_DEFINITIONS) {
            if (definition.aliases.some(alias => containsAlias(haystack, alias))) {
                slugs.add(definition.slug);
            }
        }
    }
    // `Book`, `Audible`, and publication names are intentionally not themes;
    // they simply produce no match in the alias map above.
    return Array.from(slugs);
}

export function getThemeDefinition(slug: string): ThemeDefinition | undefined {
    return THEME_DEFINITIONS.find(theme => theme.slug === slug);
}

export function getThemeLabel(slug: string): string {
    return getThemeDefinition(slug)?.label ?? slug;
}

export function getThemeSlug(value: string): string {
    return normalizeTheme(value) ?? value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
