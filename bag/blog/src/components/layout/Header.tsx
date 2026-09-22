import Link from 'next/link';
import { NAV_LINKS } from '@/lib/navigation';
import { ARCHIVE_SECTIONS, SITE_TAGLINE, type ArchiveSectionKey } from '@/data/site';

interface HeaderProps {
    backLink?: string;
    backLabel?: string;
    activePath?: string;
}

export const Header = ({
    backLink,
    backLabel,
    activePath,
}: HeaderProps) => {
    return (
        <header className="retro-header">
            <a href="#main-content" className="retro-skip-link">本文へスキップ</a>
            <div className="retro-identity">
                {activePath === '/' ? (
                    <>
                        <h1 className="retro-logo">ryota.onuma.dev</h1>
                        <p className="retro-subtitle">{SITE_TAGLINE}</p>
                    </>
                ) : (
                    <Link href="/" className="retro-logo" aria-label="ryota.onuma.dev ホーム">ryota.onuma.dev</Link>
                )}
            </div>
            <nav aria-label="主なページ">
                {NAV_LINKS.map((item) => {
                    const section = ARCHIVE_SECTIONS[item as ArchiveSectionKey];
                    return (
                    <span key={item}>
                        {activePath === section.href ? (
                            <strong aria-current="page">{section.navLabel}</strong>
                        ) : (
                            <Link href={section.href}>{section.navLabel}</Link>
                        )}
                    </span>
                )})}
            </nav>
            {backLink && (
                <p className="retro-back">
                    <Link href={backLink}>← {backLabel || 'Back'}</Link>
                </p>
            )}
        </header>
    );
};
