export interface ContentItem {
    id: string;
    type: 'external' | 'internal';
    title: string;
    category: string;
    description: string;
    date: string;
    tags: string[];
    thumbnail: string;
    url?: string;
    slug?: string;
}

interface FrontmatterData {
    id?: string;
    title?: string;
    category?: string;
    description?: string;
    date?: string;
    tags?: string[];
    thumbnail?: string;
    url?: string;
    external_url?: string;
}

// Vite's dynamic import for all markdown files
const postFiles: Record<string, { default: string }> = import.meta.glob('../content/posts/*.md', { query: '?raw', eager: true });

function parseFrontmatter(content: string): FrontmatterData {
    const match = content.match(/^---\s*([\s\S]*?)\s*---/);
    if (!match) return {};

    const frontmatterRaw = match[1];
    const data: FrontmatterData = {};

    frontmatterRaw.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const key = line.slice(0, colonIndex).trim();
            let value = line.slice(colonIndex + 1).trim();

            // Handle quotes
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
            }

            // Handle arrays (simple case for tags: ["AI", "Blog"])
            if (value.startsWith('[') && value.endsWith(']')) {
                (data as Record<string, string | string[]>)[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
            } else {
                (data as Record<string, string | string[]>)[key] = value;
            }
        }
    });

    return data;
}

export const contents: ContentItem[] = Object.entries(postFiles).map(([path, module]) => {
    const rawContent = module.default;
    const data = parseFrontmatter(rawContent);
    const slug = path.split('/').pop()?.replace('.md', '');

    const externalUrl = data.url || data.external_url;

    return {
        id: data.id || slug || '',
        type: externalUrl ? 'external' : 'internal',
        title: data.title || 'Untitled',
        category: data.category || 'Blog',
        description: data.description || '',
        date: data.date || '',
        tags: data.tags || [],
        thumbnail: data.thumbnail || '/thumbnails/default_blog.png',
        url: externalUrl,
        slug: externalUrl ? undefined : slug
    } as ContentItem;
}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

