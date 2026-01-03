'use client';

import { MessageSquare } from 'lucide-react';

interface ScrapCardProps {
    title: string;
    emoji: string;
    status: 'open' | 'closed';
    date: string;
    tags: string[];
    threadCount: number;
    index: number;
}

export const ScrapCard = ({ title, emoji, status, date, tags, threadCount, index }: ScrapCardProps) => {
    return (
        <article
            className="group relative bg-white rounded-2xl border border-black/10 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{emoji}</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                    {status}
                </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-black mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                {title}
            </h3>

            {/* Tags */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-black/5 rounded text-[10px] font-medium text-black/50">
                            {tag}
                        </span>
                    ))}
                    {tags.length > 3 && (
                        <span className="px-2 py-0.5 text-[10px] font-medium text-black/30">
                            +{tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-black/40">
                <span>{date}</span>
                <div className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{threadCount}</span>
                </div>
            </div>

            {/* Hover Indicator */}
            <div className="absolute inset-0 rounded-2xl border-2 border-accent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </article>
    );
};
