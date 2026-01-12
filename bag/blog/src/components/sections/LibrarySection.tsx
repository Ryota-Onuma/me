'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BookCard, SectionHeading, TagFilterButton, SortDropdown } from '../ui';
import { useLibraryFilter, type BookStatus } from '@/hooks/useLibraryFilter';
import { BACKGROUND_COLOR_LIGHT } from '@/lib/constants';
import type { BookItem } from '@/lib/books';

interface LibrarySectionProps {
    books: BookItem[];
}

const STATUS_OPTIONS: { value: BookStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'yet', label: '積読' },
    { value: 'reading', label: '読書中' },
    { value: 'completed', label: '読了' },
];

export const LibrarySection = ({ books }: LibrarySectionProps) => {
    const router = useRouter();
    const {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        statusFilter,
        setStatusFilter,
        sortOption,
        setSortOption,
        allTags,
        filteredBooks,
        filteredCount
    } = useLibraryFilter(books);

    return (
        <section id="library" className="pt-28 pb-20 md:py-32 px-6 md:px-16 lg:px-24" style={{ backgroundColor: BACKGROUND_COLOR_LIGHT }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div>
                    <SectionHeading title="Library" />
                    <p className="text-black/50 text-base mt-4 max-w-2xl leading-relaxed">
                        Books I've read and the learnings gained from them.<br />
                        <span className="text-black font-semibold">{filteredCount}</span> books
                        {selectedTag && <> filtered by <span className="text-black px-2 py-0.5 rounded bg-black/10 text-xs uppercase font-bold tracking-wider">{selectedTag}</span></>}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-8 mb-16">
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                    {/* Search Input */}
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 group-focus-within:text-accent transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by title or author..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-black/[0.02] backdrop-blur-xl border border-black/10 rounded-2xl text-sm text-black placeholder-black/30 focus:outline-none focus:border-accent focus:bg-accent-light transition-all"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {STATUS_OPTIONS.map(option => (
                            <TagFilterButton
                                key={option.value}
                                label={option.label}
                                isSelected={statusFilter === option.value}
                                onClick={() => setStatusFilter(option.value)}
                            />
                        ))}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="md:ml-auto">
                        <SortDropdown value={sortOption} onChange={setSortOption} />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <TagFilterButton
                        label="All Topics"
                        isSelected={selectedTag === null}
                        onClick={() => setSelectedTag(null)}
                    />
                    {allTags.map(tag => (
                        <TagFilterButton
                            key={tag}
                            label={tag}
                            isSelected={selectedTag === tag}
                            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        />
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredBooks.map((book, idx) => (
                    <div
                        key={book.id}
                        onClick={() => window.open(`/library/${book.slug}`, '_blank')}
                        className="cursor-pointer"
                    >
                        <BookCard
                            title={book.title}
                            author={book.author}
                            status={book.status}
                            cover={book.cover}
                            readDate={book.readDate}
                            rating={book.rating}
                            tags={book.tags}
                            index={idx}
                        />
                    </div>
                ))}
            </div>

            {filteredCount === 0 && (
                <div className="text-center py-32 border border-dashed border-black/10 rounded-3xl">
                    <p className="text-black/40 text-sm">No books found matching your criteria</p>
                    <button
                        onClick={() => { setSearchQuery(''); setSelectedTag(null); setStatusFilter('all'); }}
                        className="mt-4 text-black/60 hover:text-black text-xs underline underline-offset-4"
                    >
                        Clear filters
                    </button>
                </div>
            )}
        </section>
    );
};
