import React from 'react';
import { Clock, Tag } from 'lucide-react';

interface ParsedPost {
    title: string;
    date: string;
    tags: string[];
    thumbnail?: string;
}

interface BlogHeroProps {
    post: ParsedPost;
}

export const BlogHero: React.FC<BlogHeroProps> = ({ post }) => {
    return (
        <header className="relative w-full min-h-[56vh] md:min-h-[64vh] flex flex-col justify-end overflow-hidden bg-[#fbfbfa] border-b border-black/10">
            <div className="absolute inset-0 z-0">
                <img
                    src={post.thumbnail || "/thumbnails/default_blog.png"}
                    alt={post.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#fbfbfa]/72" />
            </div>

            <div className="relative z-10 px-6 md:px-24 pb-16 md:pb-24 max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                    <span className="flex items-center gap-2 text-sm text-black/70 font-medium">
                        <Clock size={14} className="text-black/60" />
                        {post.date}
                    </span>
                    <div className="flex gap-2 flex-wrap">
                        {post.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1.5 text-xs bg-white px-2.5 py-1 rounded-md text-black/70 font-medium border border-black/10">
                                <Tag size={10} className="text-black/60" />
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <h1 className="mb-0 text-black md:text-5xl lg:text-6xl font-semibold leading-tight">
                    {post.title}
                </h1>
            </div>
        </header>
    );
};
