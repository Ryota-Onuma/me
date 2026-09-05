import { SOCIAL_LINKS } from '@/data/socialLinks';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { TrackedLink } from '@/components/analytics/TrackedLink';

export const Footer = () => {
    return (
        <footer className="retro-footer">
            <p className="retro-footer-mark" aria-hidden="true">— ARCHIVE DESK —</p>
            <p className="retro-footer-links">
                {SOCIAL_LINKS.map((link, index) => (
                    <span key={link.label}>
                        {index > 0 && ' ｜ '}
                        <ExternalLink href={link.href} showIndicator={false}>{link.label}</ExternalLink>
                    </span>
                ))}
                {' ｜ '}<TrackedLink href="/feed.xml" eventName="rss_click">RSS 2.0</TrackedLink>
            </p>
            <p>収集・整理・文責：<span lang="en">Ryota Onuma</span></p>
            <p className="retro-footer-english">Filed and maintained by Ryota Onuma.</p>
        </footer>
    );
};
