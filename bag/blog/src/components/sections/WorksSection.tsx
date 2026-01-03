import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WorkCard } from '../ui/WorkCard';
import { SectionHeading } from '../ui/SectionHeading';
import { useBlogFilter } from '../../hooks/useBlogFilter';

export const WorksSection = () => {
    const navigate = useNavigate();
    const {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        allTags,
        filteredContents
    } = useBlogFilter();

    return (
        <section id="blog" className="pt-28 pb-20 md:py-32 px-6 md:px-16 lg:px-24 bg-[#fafafa]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div>
                    <SectionHeading title="Blog" />
                    <p className="text-black/50 text-base mt-4 max-w-2xl leading-relaxed">
                        Thoughts, tutorials, and insights on development and design.<br />
                        <span className="text-black font-semibold">{filteredContents.length}</span> articles
                        {selectedTag && <> filtered by <span className="text-black px-2 py-0.5 rounded bg-black/10 text-xs uppercase font-bold tracking-wider">{selectedTag}</span></>}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-8 mb-16">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 group-focus-within:text-accent transition-colors" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-black/[0.02] backdrop-blur-xl border border-black/10 rounded-2xl text-sm text-black placeholder-black/30 focus:outline-none focus:border-accent focus:bg-accent-light transition-all"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedTag(null)}
                        className={`cursor-pointer px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${!selectedTag
                            ? 'bg-accent text-white border-accent shadow-[0_0_20px_rgba(118,181,197,0.3)]'
                            : 'bg-transparent text-black/40 border-black/10 hover:border-accent/40 hover:text-accent'
                            }`}
                    >
                        All Topics
                    </button>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                            className={`cursor-pointer px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${selectedTag === tag
                                ? 'bg-accent text-white border-accent shadow-[0_0_20px_rgba(118,181,197,0.3)]'
                                : 'bg-transparent text-black/40 border-black/10 hover:border-accent/40 hover:text-accent'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredContents.map((item, idx) => (
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

            {filteredContents.length === 0 && (
                <div className="text-center py-32 border border-dashed border-black/10 rounded-3xl">
                    <p className="text-black/40 text-sm">No articles found matching your criteria</p>
                    <button
                        onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
                        className="mt-4 text-black/60 hover:text-black text-xs underline underline-offset-4"
                    >
                        Clear filters
                    </button>
                </div>
            )}
        </section>
    );
};
