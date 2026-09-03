'use client';

import { WorkCard, SectionHeading, TagFilterButton } from '../ui';
import { useBlogFilter } from '@/hooks/useBlogFilter';
import type { ContentItem } from '@/lib/posts';
import { getThemeLabel, normalizeTheme } from '@/lib/themes';

interface WorksSectionProps {
    contents: ContentItem[];
}

export const WorksSection = ({ contents }: WorksSectionProps) => {
    const {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        selectedTheme,
        setSelectedTheme,
        allTags,
        allThemes,
        filteredContents,
        totalItems,
        resetFilters
    } = useBlogFilter(contents);
    const hasActiveFilters = Boolean(searchQuery || selectedTag || selectedTheme);

    return (
        <section id="blog" className="retro-page">
            <SectionHeading title="技術ノート" />
            <p className="retro-lead" role="status" aria-live="polite">
                技術記事、仕事の記録、考えたこと。全{totalItems}件中{filteredContents.length}件
                {selectedTheme && <>（テーマ：{getThemeLabel(selectedTheme)} で絞り込み中）</>}
                {selectedTag && <>（タグ：{selectedTag} で絞り込み中）</>}
            </p>

            <label className="retro-search-label">
                キーワード：
                <input
                    type="search"
                    placeholder="タイトル・概要・タグを検索"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </label>

            <details className="retro-filter-panel">
                <summary>記事を検索・絞り込む</summary>
                <fieldset className="retro-filter-box">
                    <legend>記事の詳細条件</legend>

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

            {hasActiveFilters && filteredContents.length > 0 && (
                <p><button type="button" onClick={resetFilters}>絞り込みを解除</button></p>
            )}

            <ul className="retro-list">
                {filteredContents.map((item) => {
                    const isExternal = item.type === 'external' && !item.hasContent;
                    return (
                        <WorkCard
                            key={item.id}
                            title={item.title}
                            category={item.category}
                            description={item.description}
                            date={item.date}
                            updated={item.updated}
                            tags={item.tags.filter(tag => !normalizeTheme(tag))}
                            themes={item.themes}
                            isExternal={isExternal}
                            analyticsId={item.id}
                            href={isExternal && item.url ? item.url : `/blog/${item.slug}`}
                        />
                    );
                })}
            </ul>

            {filteredContents.length === 0 && (
                <div className="retro-empty">
                    <p>条件に合う記事はありません。</p>
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
