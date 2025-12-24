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

// Vite's dynamic import for all markdown files
const postFiles = import.meta.glob('../content/posts/*.md', { query: '?raw', eager: true });

function parseFrontmatter(content: string) {
    const match = content.match(/^---\s*([\s\S]*?)\s*---/);
    if (!match) return {};

    const frontmatterRaw = match[1];
    const data: any = {};

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
                data[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
            } else {
                data[key] = value;
            }
        }
    });

    return data;
}

export const contents: ContentItem[] = Object.entries(postFiles).map(([path, module]: [string, any]) => {
    const rawContent = module.default;
    const data = parseFrontmatter(rawContent);
    const slug = path.split('/').pop()?.replace('.md', '');

    return {
        id: data.id || slug,
        type: data.url ? 'external' : 'internal',
        title: data.title || 'Untitled',
        category: data.category || 'Blog',
        description: data.description || '',
        date: data.date || '',
        tags: data.tags || [],
        thumbnail: data.thumbnail || '/thumbnails/default_blog.png',
        url: data.url,
        slug: data.url ? undefined : slug
    } as ContentItem;
}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
