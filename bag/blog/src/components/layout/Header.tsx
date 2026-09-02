import Link from 'next/link';
import Image from 'next/image';
import { NAV_LINKS } from '@/lib/navigation';

interface HeaderProps {
    backLink?: string;
    backLabel?: string;
    activePath?: string;
}

const navLabels: Record<string, string> = {
    about: 'ホーム',
    blog: '技術ノート',
    scrap: '雑記帳',
    library: '読書記録',
    themes: 'テーマ',
};

export const Header = ({
    backLink,
    backLabel,
    activePath,
}: HeaderProps) => {
    const getLinkPath = (item: string) => {
        return item === 'about' ? '/' : `/${item}`;
    };

    return (
        <header className="retro-header">
            <a href="#main-content" className="retro-skip-link">本文へスキップ</a>
            <div className="retro-identity">
                <Link href="/" className="retro-logo" aria-label="ryota.onuma.dev ホーム">
                    <Image src="/icon-192x192.png" alt="" width={38} height={38} priority />
                    <span>ryota.onuma.dev</span>
                </Link>
                <p className="retro-subtitle">ソフトウェアと読書の個人ページ</p>
            </div>
            <nav aria-label="主なページ">
                {NAV_LINKS.map((item, index) => (
                    <span key={item}>
                        {index > 0 && <b aria-hidden="true"> / </b>}
                        {activePath === getLinkPath(item) ? (
                            <strong aria-current="page">{navLabels[item]}</strong>
                        ) : (
                            <Link href={getLinkPath(item)}>{navLabels[item]}</Link>
                        )}
                    </span>
                ))}
            </nav>
            {backLink && (
                <p className="retro-back">
                    <Link href={backLink}>← {backLabel || 'Back'}</Link>
                </p>
            )}
        </header>
    );
};
