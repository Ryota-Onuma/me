import { ArrowUpRight, Calendar, ExternalLink } from 'lucide-react';

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

    const CardContent = (
        <article className="group relative flex flex-col h-full bg-black/[0.02] border border-black/10 rounded-2xl overflow-hidden hover:bg-black/[0.04] hover:border-accent-dim hover:shadow-2xl hover:shadow-accent/5 transition-premium ease-out hover:-translate-y-1">
            {/* Thumbnail */}
            <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                    src={thumbnail || "/thumbnails/default_blog.png"}
                    alt={title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-1000 ease-out"
                    loading={isAboveFold ? "eager" : "lazy"}
                    {...(isAboveFold && { fetchpriority: "high" })}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                {/* Category badge */}
                <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-md border border-black/10 text-[10px] text-black px-3 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-lg group-hover:border-accent/40 transition-colors">
                        {category}
                    </span>
                </div>

                {/* External indicator */}
                {(isExternal || url) && (
                    <div className="absolute top-4 right-4">
                        <span className="w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-md border border-black/10 rounded-full text-black transition-all duration-500 group-hover:rotate-45 group-hover:bg-accent group-hover:border-accent group-hover:text-white">
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
                        <span className="text-[11px] font-medium text-black/50 uppercase tracking-widest">
                            {date}
                        </span>
                    </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-bold leading-tight mb-3 text-black group-hover:text-accent line-clamp-2 transition-colors duration-500">
                    {title}
                </h3>

                {/* Description */}
                {description && (
                    <p className="text-sm text-black/50 leading-relaxed line-clamp-2 mb-5 group-hover:text-black/70 transition-colors duration-500">
                        {description}
                    </p>
                )}

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

                {/* Read more */}
                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-black/5 group-hover:border-accent/20 transition-colors">
                    <span className="text-xs font-bold uppercase tracking-wider text-black/40 group-hover:text-accent transition-colors duration-500">
                        Read Article
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-black/40 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-500" />
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
