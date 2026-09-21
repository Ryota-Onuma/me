'use client';

import { BookCard, SectionHeading, TagFilterButton, SortDropdown } from '../ui';
import { useLibraryFilter, type BookStatus } from '@/hooks/useLibraryFilter';
import type { BookItem } from '@/lib/books';
import { getThemeLabel, isMediaTag } from '@/lib/themes';

interface LibrarySectionProps {
    books: BookItem[];
}

const STATUS_OPTIONS: { value: BookStatus; label: string }[] = [
    { value: 'all', label: 'すべて' },
    { value: 'yet', label: '未読' },
    { value: 'reading', label: '読書中' },
    { value: 'completed', label: '読了' },
];

export const LibrarySection = ({ books }: LibrarySectionProps) => {
    const {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        selectedTheme,
        setSelectedTheme,
        statusFilter,
        setStatusFilter,
        sortOption,
        setSortOption,
        allTags,
        allThemes,
        filteredBooks,
        filteredCount,
        totalCount,
        resetFilters
    } = useLibraryFilter(books);
    const hasActiveFilters = Boolean(
        searchQuery || selectedTag || selectedTheme || statusFilter !== 'all' || sortOption !== 'readDate-newest'
    );

    return (
        <section id="library" className="retro-page">
            <SectionHeading section="library" />
            <p className="retro-lead" role="status" aria-live="polite">
                読んだ本と、そこから得た学びの記録。全{totalCount}冊中{filteredCount}冊
                {selectedTheme && <>（テーマ：{getThemeLabel(selectedTheme)} で絞り込み中）</>}
                {selectedTag && <>（タグ：{selectedTag} で絞り込み中）</>}
            </p>

            <label className="retro-search-label">
                キーワード：
                <input
                    type="search"
                    placeholder="書名・著者名を検索"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </label>

            <details className="retro-filter-panel">
                <summary>テーマ・分類で絞る</summary>
                <fieldset className="retro-filter-box">
                    <legend>本の詳細条件</legend>

                    <div className="retro-filter-row">
                        <span>読書状況：</span>
                        {STATUS_OPTIONS.map(option => (
                            <TagFilterButton
                                key={option.value}
                                label={option.label}
                                isSelected={statusFilter === option.value}
                                onClick={() => setStatusFilter(option.value)}
                            />
                        ))}
                    </div>

                    <SortDropdown value={sortOption} onChange={setSortOption} />

                <div className="retro-filter-row">
                    <span>テーマ：</span>
                    <TagFilterButton
                        label="全テーマ"
                        isSelected={selectedTheme === null}
                        onClick={() => setSelectedTheme(null)}
                    />
                    {allThemes.map(theme => (
                        <TagFilterButton
                            key={theme}
                                label={getThemeLabel(theme)}
                            isSelected={selectedTheme === theme}
                            onClick={() => setSelectedTheme(selectedTheme === theme ? null : theme)}
                        />
                    ))}
                </div>

                <div className="retro-filter-row">
                    <span>分類：</span>
                    <TagFilterButton
                        label="すべて"
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
                </fieldset>
            </details>

            {hasActiveFilters && filteredCount > 0 && (
                <p><button type="button" onClick={resetFilters}>絞り込みを解除</button></p>
            )}

            <ul className="retro-list">
                {filteredBooks.map((book, idx) => (
                    <BookCard
                        key={book.id}
                        href={book.hasNotes ? `/library/${book.slug}` : book.externalUrl}
                        title={book.title}
                        author={book.author}
                        status={book.status}
                        cover={book.cover}
                        readDate={book.readDate}
                        updated={book.updated}
                        rating={book.rating}
                        tags={book.tags.filter(tag => !isMediaTag(tag))}
                        themes={book.themes}
                        hasNotes={book.hasNotes}
                        analyticsId={book.id}
                        index={idx}
                    />
                ))}
            </ul>

            {filteredCount === 0 && (
                <div className="retro-empty">
                    <p>条件に合う本はありません。</p>
                    <button
                        type="button"
                        onClick={resetFilters}
                    >
                        絞り込みを解除
                    </button>
                </div>
            )}
        </section>
    );
};
