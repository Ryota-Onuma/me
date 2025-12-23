import { WorkCard } from '../ui/WorkCard';

interface Work {
    title: string;
    cat: string;
    description: string;
    date: string;
    tags: string[];
    thumbnail: string;
    url?: string;
}

const works: Work[] = [
    {
        title: 'Building Scalable Agentic Systems',
        cat: 'Zenn / Tech',
        description: 'Exploring the architectural patterns for building autonomous AI agents that can scale and collaborate in multi-agent environments.',
        date: 'Dec 22, 2024',
        tags: ['AI', 'Architecture', 'Agents'],
        thumbnail: '/thumbnails/agentic_systems.png',
        url: 'https://zenn.dev/'
    },
    {
        title: 'The Future of AI-First Development',
        cat: 'Note / Design',
        description: 'How AI is changing the way we approach product development, from brainstorming to deployment, and the new role of the developer.',
        date: 'Dec 15, 2024',
        tags: ['Future', 'Dev', 'AI'],
        thumbnail: '/thumbnails/ai_development.png',
        url: 'https://note.com/'
    },
    {
        title: 'Designing for the Invisible',
        cat: 'Qiita / Architecture',
        description: 'Minimalism, transparency, and the art of staying out of the user\'s way while providing powerful functionality.',
        date: 'Dec 03, 2024',
        tags: ['Design', 'Minimalism', 'UX'],
        thumbnail: '/thumbnails/invisible_design.png',
        url: 'https://qiita.com/'
    },
    {
        title: 'React Performance Deep Dive',
        cat: 'Medium / Engineering',
        description: 'Highly specialized techniques for optimizing React applications, focusing on rendering bottlenecks and state management.',
        date: 'Nov 28, 2024',
        tags: ['React', 'Performance', 'JS'],
        thumbnail: '/thumbnails/react_performance.png',
        url: 'https://medium.com/'
    }
];

/**
 * WorksSection - Worksセクション
 */
export const WorksSection = () => (
    <section id="works" className="py-32 md:py-64 px-6 md:px-24 bg-[#050505]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 md:mb-40 gap-8">
            <h2 className="text-6xl sm:text-8xl md:text-[12rem] font-black tracking-[-0.07em] italic uppercase text-white/10 select-none leading-none mix-blend-overlay">
                Works
            </h2>
            <span className="text-[10px] md:text-xs tracking-[0.6em] text-white/70 uppercase font-black mb-0 md:mb-6 italic">
                Articles & Thoughts
            </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 md:gap-y-32">
            {works.map((work, i) => (
                <div key={i} className={i % 2 === 1 ? 'md:mt-32' : ''}>
                    <WorkCard
                        title={work.title}
                        category={work.cat}
                        description={work.description}
                        date={work.date}
                        tags={work.tags}
                        thumbnail={work.thumbnail}
                        url={work.url}
                    />
                </div>
            ))}
        </div>
    </section>
);
