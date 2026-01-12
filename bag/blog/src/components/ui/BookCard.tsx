'use client';

import { Star, Calendar } from 'lucide-react';
import { useState } from 'react';

interface BookCardProps {
    title: string;
    author: string;
    status: 'yet' | 'reading' | 'completed';
    cover?: string;
    readDate?: string;
    rating?: number;
    tags?: string[];
    index?: number; // For LCP optimization
}

const STATUS_LABELS: Record<'yet' | 'reading' | 'completed', string> = {
    yet: '積読',
    reading: '読書中',
    completed: '読了',
};

const STATUS_STYLES: Record<'yet' | 'reading' | 'completed', string> = {
    yet: 'bg-gray-100 text-gray-600',
    reading: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-accent/10 text-accent',
};

export const BookCard = ({ title, author, status, cover, readDate, rating, tags, index = 0 }: BookCardProps) => {
    const isAboveFold = index < 3;
    const [isLoaded, setIsLoaded] = useState(false);

    const renderStars = (rating?: number) => {
        if (!rating) return <span className="text-[11px] text-black/40">Not Rated</span>;

        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-3 h-3 ${
                            star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-black/20'
                        }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <article className="group relative flex flex-col h-full bg-black/[0.02] border border-black/10 rounded-2xl overflow-hidden hover:bg-black/[0.04] hover:border-accent-dim hover:shadow-2xl hover:shadow-accent/5 transition-premium ease-out hover:-translate-y-1">
            {/* Cover Image */}
            <div className={`relative aspect-[2/3] overflow-hidden bg-gray-100 ${!isLoaded ? 'shimmer' : ''}`}>
                <img
                    src={cover || "/books/default_cover.png"}
                    alt={title}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading={isAboveFold ? "eager" : "lazy"}
                    onLoad={() => setIsLoaded(true)}
                    {...(isAboveFold && { fetchPriority: "high" })}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                {/* Status badge */}
                <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center gap-1.5 backdrop-blur-md border border-black/10 text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-lg ${STATUS_STYLES[status]}`}>
                        {STATUS_LABELS[status]}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1 relative">
                {/* Read Date or Status */}
                {readDate ? (
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-3 h-3 text-black/40" />
                        <span className="text-[11px] font-medium text-black/50 uppercase tracking-widest">
                            {readDate}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] font-medium text-black/50 uppercase tracking-widest">
                            {STATUS_LABELS[status]}
                        </span>
                    </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-bold leading-tight mb-2 text-black group-hover:text-accent line-clamp-2 transition-colors duration-500">
                    {title}
                </h3>

                {/* Author */}
                <p className="text-sm text-black/50 mb-3 group-hover:text-black/70 transition-colors duration-500">
                    {author}
                </p>

                {/* Rating */}
                <div className="mb-4">
                    {renderStars(rating)}
                </div>

                {/* Tags */}
                <div className="mt-auto flex flex-wrap gap-1.5">
                    {tags?.filter(tag => tag && tag.trim()).slice(0, 3).map((tag, idx) => (
                        <span
                            key={idx}
                            className="text-[10px] font-medium text-black/40 px-2 py-1 rounded bg-black/5 border border-black/5 group-hover:border-accent/20 group-hover:text-black/60 transition-colors"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </article>
    );
};
