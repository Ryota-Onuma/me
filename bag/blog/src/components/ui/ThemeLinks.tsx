import Link from 'next/link';
import { getThemeLabel, getThemeSlug } from '@/lib/themes';

interface ThemeLinksProps {
    themes?: string[];
    label?: string;
}

export const ThemeLinks = ({ themes = [], label = 'テーマ' }: ThemeLinksProps) => {
    const uniqueThemes = Array.from(new Set(themes.filter(Boolean)));
    if (!uniqueThemes.length) return null;
    return (
        <p className="retro-card-themes" aria-label={label}>
            {label}：{uniqueThemes.map((theme, index) => (
                <span key={theme}>
                    {index > 0 && ' / '}
                    <Link href={`/themes/${getThemeSlug(theme)}`}>{getThemeLabel(getThemeSlug(theme))}</Link>
                </span>
            ))}
        </p>
    );
};

