export interface ParsedPost {
    title: string;
    date: string;
    tags: string[];
    content: string;
    thumbnail?: string;
}

/**
 * parseMarkdownPost - Markdown ファイルから frontmatter とコンテンツをパースする
 * @param rawContent - 生の Markdown テキスト
 * @returns パースされた投稿データ、またはパース失敗時は null
 */
export const parseMarkdownPost = (rawContent: string): ParsedPost | null => {
    const match = rawContent.match(/^---\s*([\s\S]*?)\s*---([\s\S]*)$/);
    if (!match) return null;

    const [, frontmatter, content] = match;
    const data: Record<string, string | string[]> = {};

    frontmatter.split('\n').forEach((line: string) => {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) return;

        const key = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();

        // Remove surrounding quotes
        value = value.replace(/^["']|["']$/g, '');

        if (key === 'tags') {
            // Handle array syntax: [tag1, tag2]
            data.tags = value
                .replace(/[\[\]]/g, '')
                .split(',')
                .map((t: string) => t.trim().replace(/^["']|["']$/g, ''));
        } else {
            data[key] = value;
        }
    });

    return {
        title: (data.title as string) || 'Untitled',
        date: (data.date as string) || '',
        tags: (data.tags as string[]) || [],
        thumbnail: data.thumbnail as string | undefined,
        content: content.trim()
    };
};
