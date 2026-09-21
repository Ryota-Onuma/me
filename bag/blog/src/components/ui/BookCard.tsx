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
    yet: 'Yet',
    reading: 'Reading',
    completed: 'Completed',
};

const STATUS_STYLES: Record<'yet' | 'reading' | 'completed', string> = {
    yet: 'bg-slate-100 text-slate-700 border border-slate-200',
    reading: 'bg-amber-50 text-amber-700 border border-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
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
                        className={`w-3 h-3 ${star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-black/20'
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <article className="group relative flex flex-col h-full bg-white border border-black/10 rounded-lg overflow-hidden hover:border-black/25 transition-premium ease-out">
            {/* Cover Image */}
            <div className={`relative aspect-[3/4] overflow-hidden bg-gray-100 ${!isLoaded ? 'shimmer' : ''}`}>
                <img
                    src={cover || "/books/default_cover.png"}
                    alt={title}
                    className={`w-full h-full object-contain transition-opacity duration-200 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading={isAboveFold ? "eager" : "lazy"}
                    onLoad={() => setIsLoaded(true)}
                    {...(isAboveFold && { fetchPriority: "high" })}
                />

                {/* Status badge */}
                <div className="absolute top-3 right-3 pointer-events-none">
                    <div className={`text-xs font-medium px-2 py-1 rounded-md flex items-center justify-center ${STATUS_STYLES[status]}`}>
                        {STATUS_LABELS[status]}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-1 relative">
                {/* Read Date or Status */}
                {readDate ? (
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-3 h-3 text-black/40" />
                        <span className="text-xs font-medium text-black/50">
                            {readDate}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-black/50">
                            {STATUS_LABELS[status]}
                        </span>
                    </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-semibold leading-tight mb-2 text-black group-hover:text-accent-hover line-clamp-2 transition-colors duration-200">
                    {title}
                </h3>

                {/* Author */}
                <p className="text-sm text-black/55 mb-3 group-hover:text-black/70 transition-colors duration-200">
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
                            className="text-xs font-medium text-black/45 px-2 py-1 rounded bg-black/[0.04] border border-black/5 group-hover:border-black/10 group-hover:text-black/60 transition-colors"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </article>
    );
};
