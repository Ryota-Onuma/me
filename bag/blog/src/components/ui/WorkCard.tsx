import { ArrowUpRight, Calendar, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface WorkCardProps {
    title: string;
    category: string;
    description?: string;
    date?: string;
    tags?: string[];
    thumbnail?: string;
    url?: string;
    isExternal?: boolean;
    index?: number; // For LCP optimization
}

export const WorkCard = ({ title, category, description, date, tags, thumbnail, url, isExternal, index = 0 }: WorkCardProps) => {
    const isAboveFold = index < 3;
    const [isLoaded, setIsLoaded] = useState(false);

    const CardContent = (
        <article className="group relative flex flex-col h-full bg-white border border-black/10 rounded-lg overflow-hidden hover:border-black/25 transition-premium ease-out">
            {/* Thumbnail */}
            <div className={`relative aspect-[16/10] overflow-hidden bg-gray-100 ${!isLoaded ? 'shimmer' : ''}`}>
                <img
                    src={thumbnail || "/thumbnails/default_blog.png"}
                    alt={title}
                    className={`w-full h-full object-contain transition-opacity duration-200 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading={isAboveFold ? "eager" : "lazy"}
                    onLoad={() => setIsLoaded(true)}
                    {...(isAboveFold && { fetchPriority: "high" })}
                />

                {/* Category badge */}
                <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 bg-white border border-black/10 text-xs text-black/70 px-2.5 py-1 rounded-md font-medium group-hover:border-black/20 transition-colors">
                        {category}
                    </span>
                </div>

                {/* External indicator */}
                {(isExternal || url) && (
                    <div className="absolute top-4 right-4">
                        <span className="w-8 h-8 flex items-center justify-center bg-white border border-black/10 rounded-md text-black transition-all duration-200 group-hover:border-black/25">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1 relative">
                {/* Date */}
                {date && (
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-3 h-3 text-black/40" />
                        <span className="text-xs font-medium text-black/50">
                            {date}
                        </span>
                    </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-semibold leading-tight mb-3 text-black group-hover:text-accent-hover line-clamp-2 transition-colors duration-200">
                    {title}
                </h3>

                {/* Description */}
                {description && (
                    <p className="text-sm text-black/55 leading-relaxed line-clamp-2 mb-5 group-hover:text-black/70 transition-colors duration-200">
                        {description}
                    </p>
                )}

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

                {/* Read more */}
                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-black/5 group-hover:border-accent/20 transition-colors">
                    <span className="text-xs font-medium text-black/45 group-hover:text-accent-hover transition-colors duration-200">
                        Read Article
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-black/40 group-hover:text-accent-hover transition-colors duration-200" />
                </div>
            </div>
        </article>
    );

    if (url) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full">
                {CardContent}
            </a>
        );
    }

    return CardContent;
};
