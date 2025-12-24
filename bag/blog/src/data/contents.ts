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

export const contents: ContentItem[] = [
    {
        id: 'agentic-writing',
        type: 'internal',
        title: 'The Art of Agentic Writing',
        category: 'Internal / Blog',
        description: 'How to craft compelling narratives using AI agents as co-authors.',
        date: 'Dec 23, 2024',
        tags: ['AI', 'Blog', 'Writing'],
        thumbnail: '/thumbnails/agentic_writing.png', // This was missing, I should check if it exists or use another one
        slug: 'hello-world'
    },
    {
        id: 'agentic-systems',
        type: 'external',
        title: 'Building Scalable Agentic Systems',
        category: 'Zenn / Tech',
        description: 'Exploring the architectural patterns for building autonomous AI agents that can scale and collaborate in multi-agent environments.',
        date: 'Dec 22, 2024',
        tags: ['AI', 'Architecture', 'Agents'],
        thumbnail: '/thumbnails/agentic_systems.png',
        url: 'https://zenn.dev/'
    },
    {
        id: 'ai-development',
        type: 'external',
        title: 'The Future of AI-First Development',
        category: 'Note / Design',
        description: 'How AI is changing the way we approach product development, from brainstorming to deployment, and the new role of the developer.',
        date: 'Dec 15, 2024',
        tags: ['Future', 'Dev', 'AI'],
        thumbnail: '/thumbnails/ai_development.png',
        url: 'https://note.com/'
    },
    {
        id: 'invisible-design',
        type: 'external',
        title: 'Designing for the Invisible',
        category: 'Qiita / Architecture',
        description: 'Minimalism, transparency, and the art of staying out of the user\'s way while providing powerful functionality.',
        date: 'Dec 03, 2024',
        tags: ['Design', 'Minimalism', 'UX'],
        thumbnail: '/thumbnails/invisible_design.png',
        url: 'https://qiita.com/'
    },
    {
        id: 'react-performance',
        type: 'external',
        title: 'React Performance Deep Dive',
        category: 'Medium / Engineering',
        description: 'Highly specialized techniques for optimizing React applications, focusing on rendering bottlenecks and state management.',
        date: 'Nov 28, 2024',
        tags: ['React', 'Performance', 'JS'],
        thumbnail: '/thumbnails/react_performance.png',
        url: 'https://medium.com/'
    }
];
