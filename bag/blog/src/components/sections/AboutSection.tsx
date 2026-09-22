import { ExternalLink } from '@/components/ui/ExternalLink';
import { TrackedLink } from '@/components/analytics/TrackedLink';

interface UpdateItem {
    id: string;
    title: string;
    date: string;
    href: string;
    isExternal: boolean;
}

const formatDate = (date: string): string => {
    const dateOnly = date.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
    if (dateOnly) {
        return `${dateOnly[1]}-${dateOnly[2].padStart(2, '0')}-${dateOnly[3].padStart(2, '0')}`;
    }
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date.slice(0, 10);
    return parsed.toISOString().slice(0, 10);
};

export const AboutSection = ({ updates }: { updates: UpdateItem[] }) => (
    <section className="retro-home" aria-labelledby="updates-heading">
        <h2 id="updates-heading">更新履歴</h2>
        <ul className="homepage-updates">
            {updates.map(item => (
                <li key={item.id}>
                    <time dateTime={formatDate(item.date)}>{formatDate(item.date)}</time>
                    {item.isExternal ? (
                        <ExternalLink href={item.href} eventName="external_article_click" eventProperties={{ contentId: item.id }}>{item.title}</ExternalLink>
                    ) : (
                        <TrackedLink href={item.href} eventName="related_click" properties={{ collection: 'home', contentId: item.id }}>{item.title}</TrackedLink>
                    )}
                </li>
            ))}
        </ul>
        {!updates.length && <p>まだ更新はありません。</p>}
    </section>
);
