import Link from 'next/link';
import type { ThemeEntry } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface ThemesSectionProps {
    themes: ThemeEntry[];
}

export const ThemesSection = ({ themes }: ThemesSectionProps) => (
    <section className="retro-page" aria-labelledby="themes-heading">
        <SectionHeading section="themes" />
        <ul className="retro-theme-list">
            {themes.map((theme) => (
                <li key={theme.slug} className="retro-index-entry">
                    <div className="retro-entry-body">
                        <h2><Link href={`/themes/${theme.slug}`}>{theme.label}</Link></h2>
                        <p>{theme.description}</p>
                    </div>
                    <p className="retro-entry-date retro-theme-count">
                        {theme.count}件
                    </p>
                </li>
            ))}
        </ul>
        {!themes.length && <p className="retro-empty">まだテーマの記録はありません。</p>}
    </section>
);
