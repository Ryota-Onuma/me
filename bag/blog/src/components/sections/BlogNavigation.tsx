import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ContentItem } from '../../data/contents';

interface BlogNavigationProps {
    prevPost: ContentItem | null;
    nextPost: ContentItem | null;
}

export const BlogNavigation: React.FC<BlogNavigationProps> = ({ prevPost, nextPost }) => {
    const navigate = useNavigate();

    const handlePostClick = (targetPost: ContentItem) => {
        if (targetPost.type === 'internal' && targetPost.slug) {
            navigate(`/blog/${targetPost.slug}`);
        } else if (targetPost.url) {
            window.open(targetPost.url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-20 pt-10 border-t border-black/10 flex flex-col md:flex-row justify-between gap-6">
            {prevPost ? (
                <button
                    onClick={() => handlePostClick(prevPost)}
                    className="group flex flex-col items-start gap-2 text-left w-full md:w-1/2 p-4 rounded-2xl hover:bg-black/5 transition-all border border-transparent hover:border-black/5 cursor-pointer"
                >
                    <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-black/40 group-hover:text-black/60 transition-colors">
                        <ArrowLeft size={12} /> Previous
                    </span>
                    <span className="text-lg font-bold text-black group-hover:text-black/90 line-clamp-2">
                        {prevPost.title}
                    </span>
                </button>
            ) : <div className="w-full md:w-1/2" />}

            {nextPost && (
                <button
                    onClick={() => handlePostClick(nextPost)}
                    className="group flex flex-col items-end gap-2 text-right w-full md:w-1/2 p-4 rounded-2xl hover:bg-black/5 transition-all border border-transparent hover:border-black/5 cursor-pointer"
                >
                    <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-black/40 group-hover:text-black/60 transition-colors">
                        Next <ArrowRight size={12} />
                    </span>
                    <span className="text-lg font-bold text-black group-hover:text-black/90 line-clamp-2">
                        {nextPost.title}
                    </span>
                </button>
            )}
        </div>
    );
};
