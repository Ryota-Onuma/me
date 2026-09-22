import { SOCIAL_LINKS } from '@/data/socialLinks';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { TrackedLink } from '@/components/analytics/TrackedLink';

export const Footer = () => {
    return (
        <footer className="retro-footer">
            <p className="retro-footer-links">
                {SOCIAL_LINKS.map((link, index) => (
                    <span key={link.label}>
                        {index > 0 && ' ｜ '}
                        <ExternalLink href={link.href} showIndicator={false}>{link.label}</ExternalLink>
                    </span>
                ))}
                {' ｜ '}<TrackedLink href="/feed.xml" eventName="rss_click">RSS</TrackedLink>
            </p>
        </footer>
    );
};
