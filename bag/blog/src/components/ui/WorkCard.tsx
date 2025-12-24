import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface WorkCardProps {
    title: string;
    category: string;
    description?: string;
    date?: string;
    tags?: string[];
    thumbnail?: string;
    url?: string;
}

/**
 * WorkCard - ブログ形式のカードコンポーネント
 */
export const WorkCard = ({ title, category, description, date, tags, thumbnail, url }: WorkCardProps) => {
    const CardContent = (
        <motion.div
            whileHover={{ y: -8 }}
            className="group flex flex-col bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden transition-colors hover:bg-white/[0.05]"
        >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden">
                <img
                    src={thumbnail || "/thumbnails/default_blog.png"}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2">
                    <span className="bg-black/60 backdrop-blur-md text-[9px] text-white/90 px-1.5 py-0.5 rounded-sm font-black uppercase tracking-[0.15em] italic border border-white/10">
                        {category}
                    </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Content */}
            <div className="p-3 md:p-4 flex flex-col flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                    {date && (
                        <span className="text-[9px] text-white/60 font-black uppercase tracking-[0.2em] italic">
                            {date}
                        </span>
                    )}
                    <div className="w-0.5 h-0.5 rounded-full bg-white/20" />
                    <div className="flex-1" />
                    <ArrowRight className="w-3 h-3 text-white/0 group-hover:text-white/100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                </div>

                <h3 className="text-sm md:text-base font-black uppercase italic tracking-tighter leading-tight mb-2 group-hover:text-white transition-colors line-clamp-2">
                    {title}
                </h3>

                {description && (
                    <p className="text-xs text-white/50 leading-relaxed line-clamp-2 mb-4 font-medium italic">
                        {description}
                    </p>
                )}

                <div className="mt-auto flex flex-wrap gap-1">
                    {tags?.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[8px] font-black text-white/40 group-hover:text-white/70 transition-all duration-300 uppercase tracking-[0.15em] italic border border-white/10 hover:border-white/30 px-2 py-0.5 rounded-full cursor-pointer bg-white/5 hover:bg-white/10">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </motion.div>
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
