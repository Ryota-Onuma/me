import { SOCIAL_LINKS } from '@/data/socialLinks';

export const Footer = () => {
    return (
        <footer className="retro-footer">
            <p className="retro-footer-links">
                {SOCIAL_LINKS.map((link, index) => (
                    <span key={link.label}>
                        {index > 0 && ' ｜ '}
                        <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
                    </span>
                ))}
                {' ｜ '}<a href="/feed.xml">RSS 2.0</a>
            </p>
            <p>最終更新：<time dateTime="2026-09-02">2026-09-02</time></p>
            <p>文責：<span lang="en">Ryota Onuma</span></p>
            <p className="retro-footer-english">This page is maintained by Ryota Onuma.</p>
        </footer>
    );
};
