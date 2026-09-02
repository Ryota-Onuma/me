import Link from 'next/link';
import type { UnifiedContent } from '@/lib/content';

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
                            <a href={item.href} target="_blank" rel="noopener noreferrer">{item.title} <small>［外部］</small></a>
                        ) : (
                            <Link href={item.href}>{item.title}</Link>
                        )}
                        {item.updated && <time dateTime={item.updated}>（{item.updated}）</time>}
                    </li>
                ))}
            </ul>
        </section>
    );
};

