import Link from 'next/link';
import Image from 'next/image';
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
                <Link href="/" className="retro-logo" aria-label="ryota.onuma.dev ホーム">
                    <Image src="/icon-192x192.png" alt="" width={38} height={38} priority />
                    <span>
                        <b>ryota.onuma.dev</b>
                        <small>PERSONAL REFERENCE ROOM</small>
                    </span>
                </Link>
                <p className="retro-subtitle">{SITE_TAGLINE}</p>
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
