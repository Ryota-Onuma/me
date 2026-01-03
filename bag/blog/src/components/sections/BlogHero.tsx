import React from 'react';
import { Clock, Tag } from 'lucide-react';
import { ParsedPost } from '../../utils/markdown';

interface BlogHeroProps {
    post: ParsedPost;
}

export const BlogHero: React.FC<BlogHeroProps> = ({ post }) => {
    return (
        <header className="relative w-full h-[60vh] md:h-[70vh] flex flex-col justify-end overflow-hidden">
            <div className="absolute inset-0 z-0">
                <img
                    src={post.thumbnail || "/thumbnails/default_blog.png"}
                    alt={post.title}
                    className="w-full h-full object-cover animate-fade-in-scale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa]/80 to-[#fafafa]/20" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#fafafa]/20 to-transparent" />
            </div>

            <div className="relative z-10 px-6 md:px-24 pb-16 md:pb-24 max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-6 flex-wrap animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <span className="flex items-center gap-2 text-xs md:text-sm text-black/80 uppercase tracking-[0.2em] font-bold">
                        <Clock size={14} className="text-black/60" />
                        {post.date}
                    </span>
                    <div className="flex gap-2 flex-wrap">
                        {post.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1.5 text-[10px] md:text-xs bg-black/10 px-3 py-1 rounded-full text-black font-bold uppercase tracking-wider border border-black/10 backdrop-blur-md">
                                <Tag size={10} className="text-black/60" />
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <h1 className="mb-0 text-black animate-fade-in-up md:text-6xl lg:text-7xl" style={{ animationDelay: '300ms' }}>
                    {post.title}
                </h1>
            </div>
        </header>
    );
};
