'use client';

import { ScrapCard, SectionHeading, TagFilterButton } from '../ui';
import { useScrapFilter, type ScrapStatus } from '@/hooks/useScrapFilter';
import type { ScrapItem } from '@/lib/scraps';
import { getThemeLabel, normalizeTheme } from '@/lib/themes';

interface ScrapSectionProps {
    scraps: ScrapItem[];
}

const STATUS_OPTIONS: ScrapStatus[] = ['all', 'open', 'closed', 'growing', 'evergreen', 'archived', 'published'];
const STATUS_LABELS: Record<ScrapStatus, string> = {
    all: 'すべて',
    open: '公開中',
    closed: '完了',
    growing: '育成中',
    evergreen: '定番',
    archived: '更新終了',
    published: 'Blog整理済み',
};

export const ScrapSection = ({ scraps }: ScrapSectionProps) => {
    const {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        selectedTheme,
        setSelectedTheme,
        statusFilter,
        setStatusFilter,
        allTags,
        allThemes,
        filteredScraps,
        filteredCount
    } = useScrapFilter(scraps);

    return (
        <section id="scrap" className="retro-page">
            <SectionHeading title="雑記帳" />
            <p className="retro-lead" role="status" aria-live="polite">
                小さなメモ、実験、考え途中の記録。現在 {filteredCount} 件
                {selectedTheme && <>（テーマ：{getThemeLabel(selectedTheme)} で絞り込み中）</>}
                {selectedTag && <>（タグ：{selectedTag} で絞り込み中）</>}
            </p>

            {/* Design intent: omit `open`; discovery controls are secondary to the archive. */}
            <details className="retro-filter-panel">
                <summary>雑記を検索・絞り込む</summary>
                <fieldset className="retro-filter-box">
                    <legend>雑記を探す</legend>
                    <label className="retro-search-label">
                        キーワード：
                        <input
                            type="search"
                            placeholder="タイトル・タグを検索"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </label>

                    {new Set(scraps.map(scrap => scrap.status)).size > 1 && <div className="retro-filter-row">
                        <span>状態：</span>
                        {STATUS_OPTIONS.map(status => (
                            <TagFilterButton
                                key={status}
                                label={STATUS_LABELS[status]}
                                isSelected={statusFilter === status}
                                onClick={() => setStatusFilter(status)}
                            />
                        ))}
                    </div>}

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

            <ul className="retro-list">
                {filteredScraps.map((scrap, idx) => (
                    <ScrapCard
                        key={scrap.id}
                        href={`/scrap/${scrap.slug}`}
                        title={scrap.title}
                        emoji={scrap.emoji}
                        status={scrap.status}
                        date={scrap.date}
                        lastUpdated={scrap.lastUpdated}
                        tags={scrap.tags.filter(tag => !normalizeTheme(tag))}
                        themes={scrap.themes}
                        threadCount={scrap.threadCount}
                        isThreaded={scrap.isThreaded}
                        index={idx}
                    />
                ))}
            </ul>

            {filteredCount === 0 && (
                <div className="retro-empty">
                    <p>条件に合う雑記はありません。</p>
                    <button
                        onClick={() => { setSearchQuery(''); setSelectedTag(null); setSelectedTheme(null); setStatusFilter('all'); }}
                    >
                        絞り込みを解除
                    </button>
                </div>
            )}
        </section>
    );
};
