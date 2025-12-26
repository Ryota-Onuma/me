import { useNavigate, Link } from 'react-router-dom';
import { WorkCard } from '../ui/WorkCard';
import { SectionHeading } from '../ui/SectionHeading';
import { contents } from '../../data/contents';
import { ArrowRight } from 'lucide-react';

const PREVIEW_COUNT = 6;

export const WorksSection = () => {
    const navigate = useNavigate();
    const previewContents = contents.slice(0, PREVIEW_COUNT);
    const remainingCount = contents.length - PREVIEW_COUNT;

    return (
        <section id="blog" className="py-20 md:py-32 px-6 md:px-16 lg:px-24 bg-[#050505]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <SectionHeading title="Blog" />

                {contents.length > PREVIEW_COUNT && (
                    <Link
                        to="/blog"
                        className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-white/90 transition-colors mb-24 self-end"
                    >
                        View All Articles
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {previewContents.map((item, idx) => (
                    <div
                        key={item.id}
                        onClick={() => {
                            if (item.type === 'internal' && item.slug) {
                                navigate(`/blog/${item.slug}`);
                            } else if (item.url) {
                                window.open(item.url, '_blank', 'noopener,noreferrer');
                            }
                        }}
                        className="cursor-pointer"
                    >
                        <WorkCard
                            title={item.title}
                            category={item.category}
                            description={item.description}
                            date={item.date}
                            tags={item.tags}
                            thumbnail={item.thumbnail}
                            isExternal={item.type === 'external'}
                            index={idx}
                        />
                    </div>
                ))}
            </div>

            {/* Mobile View All + Counter */}
            {contents.length > PREVIEW_COUNT && (
                <div className="flex flex-col items-center mt-12">
                    <Link
                        to="/blog"
                        className="md:hidden flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full text-sm font-semibold"
                    >
                        View All Articles
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-white/40 text-sm mt-4">
                        +{remainingCount} more article{remainingCount !== 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </section>
    );
};
