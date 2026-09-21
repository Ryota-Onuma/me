import Link from 'next/link';
import type { ThemeEntry } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ARCHIVE_SECTIONS, formatAccessionNumber } from '@/data/site';

interface ThemesSectionProps {
    themes: ThemeEntry[];
}

export const ThemesSection = ({ themes }: ThemesSectionProps) => (
    <section className="retro-page" aria-labelledby="themes-heading">
        <SectionHeading section="themes" />
        <p className="retro-lead">技術ノート・雑記帳・読書記録を横断する、いままでの関心の地図。</p>
        <ul className="retro-theme-list">
            {themes.map((theme, index) => (
                <li key={theme.slug} className="retro-index-entry">
                    <p className="retro-accession">{formatAccessionNumber(ARCHIVE_SECTIONS.themes.accessionPrefix, index)}</p>
                    <p className="retro-entry-type">横断テーマ</p>
                    <div className="retro-entry-body">
                        <h2><Link href={`/themes/${theme.slug}`}>{theme.label}</Link></h2>
                        <p>{theme.description}</p>
                    </div>
                    <p className="retro-entry-date retro-theme-count">
                        <b>{theme.count}件</b>
                        <span>
                        {theme.count} 件（技術 {theme.blogCount} / 雑記 {theme.scrapCount} / 読書 {theme.libraryCount}）
                        </span>
                    </p>
                </li>
            ))}
        </ul>
        {!themes.length && <p className="retro-empty">まだテーマの記録はありません。</p>}
    </section>
);
