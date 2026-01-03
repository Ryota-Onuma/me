'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { ScrapCard, SectionHeading } from '../ui';
import { BACKGROUND_COLOR_LIGHT } from '@/lib/constants';
import type { ScrapItem } from '@/lib/scraps';

interface ScrapSectionProps {
    scraps: ScrapItem[];
}

export const ScrapSection = ({ scraps }: ScrapSectionProps) => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        scraps.forEach(scrap => scrap.tags.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [scraps]);

    const filteredScraps = useMemo(() => {
        return scraps.filter(scrap => {
            const matchesSearch = scrap.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = !selectedTag || scrap.tags.includes(selectedTag);
            const matchesStatus = statusFilter === 'all' || scrap.status === statusFilter;
            return matchesSearch && matchesTag && matchesStatus;
        });
    }, [scraps, searchQuery, selectedTag, statusFilter]);

    return (
        <section id="scrap" className="pt-28 pb-20 md:py-32 px-6 md:px-16 lg:px-24" style={{ backgroundColor: BACKGROUND_COLOR_LIGHT }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div>
                    <SectionHeading title="Scrap" />
                    <p className="text-black/50 text-base mt-4 max-w-2xl leading-relaxed">
                        Quick notes, experiments, and work-in-progress thoughts.<br />
                        <span className="text-black font-semibold">{filteredScraps.length}</span> scraps
                        {selectedTag && <> filtered by <span className="text-black px-2 py-0.5 rounded bg-black/10 text-xs uppercase font-bold tracking-wider">{selectedTag}</span></>}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-8 mb-16">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 group-focus-within:text-accent transition-colors" />
                        <input
                            type="text"
                            placeholder="Search scraps..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-black/[0.02] backdrop-blur-xl border border-black/10 rounded-2xl text-sm text-black placeholder-black/30 focus:outline-none focus:border-accent focus:bg-accent-light transition-all"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {(['all', 'open', 'closed'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`cursor-pointer px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${statusFilter === status
                                        ? 'bg-accent text-white border-accent shadow-[0_0_20px_rgba(118,181,197,0.3)]'
                                        : 'bg-transparent text-black/40 border-black/10 hover:border-accent/40 hover:text-accent'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
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
                {filteredScraps.map((scrap, idx) => (
                    <div
                        key={scrap.id}
                        onClick={() => router.push(`/scrap/${scrap.slug}`)}
                        className="cursor-pointer"
                    >
                        <ScrapCard
                            title={scrap.title}
                            emoji={scrap.emoji}
                            status={scrap.status}
                            date={scrap.date}
                            tags={scrap.tags}
                            threadCount={scrap.threadCount}
                            index={idx}
                        />
                    </div>
                ))}
            </div>

            {filteredScraps.length === 0 && (
                <div className="text-center py-32 border border-dashed border-black/10 rounded-3xl">
                    <p className="text-black/40 text-sm">No scraps found matching your criteria</p>
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
