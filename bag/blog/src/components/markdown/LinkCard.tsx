import { fetchOGP } from '@/lib/ogp';

interface LinkCardProps {
    url: string;
}

/**
 * LinkCard - Server Component that fetches OGP at build time
 * No external API dependency (Microlink not needed)
 */
export async function LinkCard({ url }: LinkCardProps) {
    const metadata = await fetchOGP(url);

    let domain = '';
    try {
        domain = new URL(url).hostname;
    } catch {
        domain = url;
    }

    const displayTitle = metadata?.title || url;
    const displayImage = metadata?.image;
    const displayDescription = metadata?.description;

    return (
        <div className="not-prose retro-link-card">
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
            >
                {displayImage && (
                    // External OGP images have arbitrary hosts and dimensions.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayImage} alt="" />
                )}
                <span>
                    <small>{domain}</small><br />
                    <b>{displayTitle}</b><br />
                    {displayDescription && <em>{displayDescription}</em>}
                </span>
            </a>
        </div>
    );
}
