import type { UnifiedContent } from '@/lib/content';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { ExternalLink } from '@/components/ui/ExternalLink';

interface RelatedContentSectionProps {
    contents: UnifiedContent[];
    title?: string;
}

const TYPE_LABELS: Record<UnifiedContent['type'], string> = {
    Blog: 'Blog',
    Scrap: 'Scrap',
    Library: 'Library',
};

export const RelatedContentSection = ({ contents, title = '関連する記録' }: RelatedContentSectionProps) => {
    if (!contents.length) return null;
    return (
        <section className="retro-related" aria-labelledby="related-heading">
            <h2 id="related-heading">{title}</h2>
            <ul>
                {contents.map(item => (
                    <li key={`${item.type}-${item.id}`}>
                        <span className="retro-related-type">[{TYPE_LABELS[item.type]}]</span>{' '}
                        {item.isExternal ? (
                            <ExternalLink
                                href={item.href}
                                eventName="related_click"
                                eventProperties={{ contentType: item.type, contentId: item.id, external: true }}
                            >
                                {item.title}
                            </ExternalLink>
                        ) : (
                            <TrackedLink
                                href={item.href}
                                eventName="related_click"
                                properties={{ contentType: item.type, contentId: item.id, external: false }}
                            >
                                {item.title}
                            </TrackedLink>
                        )}
                        {item.updated && <time dateTime={item.updated}>（{item.updated}）</time>}
                    </li>
                ))}
            </ul>
        </section>
    );
};
