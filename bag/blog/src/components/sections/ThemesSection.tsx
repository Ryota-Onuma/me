import Link from 'next/link';
import type { ThemeEntry } from '@/lib/content';

interface ThemesSectionProps {
    themes: ThemeEntry[];
}

export const ThemesSection = ({ themes }: ThemesSectionProps) => (
    <section className="retro-page" aria-labelledby="themes-heading">
        <div className="retro-section-heading">
            <h1 id="themes-heading">テーマ</h1>
            <hr />
            <p>技術ノート・雑記帳・読書記録を横断する、いままでの関心の地図。</p>
        </div>
        <ul className="retro-theme-list">
            {themes.map(theme => (
                <li key={theme.slug}>
                    <h2><Link href={`/themes/${theme.slug}`}>{theme.label}</Link></h2>
                    <p>{theme.description}</p>
                    <p className="retro-card-meta">
                        {theme.count} 件（技術 {theme.blogCount} / 雑記 {theme.scrapCount} / 読書 {theme.libraryCount}）
                    </p>
                </li>
            ))}
        </ul>
        {!themes.length && <p className="retro-empty">まだテーマの記録はありません。</p>}
    </section>
);
