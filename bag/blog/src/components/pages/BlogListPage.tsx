import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { contents } from '../../data/contents';
import { WorkCard } from '../ui/WorkCard';
import { NoiseOverlay, Spotlight } from '../effects';
import { Header, Footer } from '../layout';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { DeferredRender } from '../utils/DeferredRender';
import { useHasScrolled } from '../../hooks/useHasScrolled';

const ITEMS_PER_PAGE = 9;

export const BlogListPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    const { isScrolled } = useHasScrolled();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        contents.forEach(item => item.tags?.forEach(tag => tags.add(tag)));
        return Array.from(tags).slice(0, 6);
    }, []);

    const filteredContents = useMemo(() => {
        return contents.filter(item => {
            const matchesSearch = !searchQuery ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = !selectedTag || item.tags?.includes(selectedTag);
            return matchesSearch && matchesTag;
        });
    }, [searchQuery, selectedTag]);

    const totalPages = Math.ceil(filteredContents.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedContents = filteredContents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        // Scroll to top on mount to ensure we start at the top
        window.scrollTo(0, 0);

        // Reset to page 1 when filters change, but only if we are not already on page 1
        if (currentPage !== 1) {
            setSearchParams({ page: '1' });
        }
    }, [searchQuery, selectedTag]);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setSearchParams({ page: page.toString() });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-[#050505] text-[#f0f0f0] font-sans min-h-screen">
            <DeferredRender timeout={100}>
                <NoiseOverlay />
                <Spotlight />
            </DeferredRender>
            <Header
                isScrolled={isScrolled}
                activeSection="blog"
                navLinks={['home', 'about', 'blog']}
                onMobileMenuOpen={() => { }}
            />

            <main className="pt-32 pb-20 px-6 md:px-16 lg:px-24 min-h-screen">
                {/* Header */}
                <div className="mb-20 animate-fade-in-up">
                    <div className="mb-12 border-b border-white/10 pb-8">
                        <h1 className="mb-4 text-white">
                            BLOG
                        </h1>
                        <p className="text-white/50 text-base md:text-lg max-w-2xl leading-relaxed">
                            Thoughts, tutorials, and insights on development and design.<br />
                            Currently featuring <span className="text-white font-semibold">{filteredContents.length}</span> articles.
                        </p>
                    </div>

                    {/* Search & Tags */}
                    <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between sticky top-20 z-40 py-4 -mx-4 px-4 md:-mx-0 md:px-0 transition-all duration-300">
                        {/* Search */}
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/60 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
                            />
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                            <button
                                onClick={() => setSelectedTag(null)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${!selectedTag
                                    ? 'bg-white text-black border-white'
                                    : 'bg-transparent text-white/50 border-white/10 hover:border-white/30 hover:text-white'
                                    }`}
                            >
                                All
                            </button>
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${selectedTag === tag
                                        ? 'bg-white text-black border-white'
                                        : 'bg-transparent text-white/50 border-white/10 hover:border-white/30 hover:text-white'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {paginatedContents.map((item, idx) => (
                        <div
                            key={item.id}
                            onClick={() => {
                                if (item.type === 'internal' && item.slug) {
                                    navigate(`/blog/${item.slug}`);
                                } else if (item.url) {
                                    window.open(item.url, '_blank', 'noopener,noreferrer');
                                }
                            }}
                            className="cursor-pointer animate-fade-in-up"
                            style={{ animationDelay: `${idx * 100}ms` }}
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

                {/* Empty */}
                {paginatedContents.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-white/40">No articles found</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-16">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                        ? 'bg-white text-black'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};
