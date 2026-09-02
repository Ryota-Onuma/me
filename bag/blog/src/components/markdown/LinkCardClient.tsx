'use client';

import { memo } from 'react';

export interface OGPData {
    title?: string;
    description?: string;
    image?: string;
    logo?: string;
    siteName?: string;
}

interface LinkCardClientProps {
    url: string;
    ogpData?: OGPData;
}

/**
 * Client-side LinkCard that displays pre-fetched OGP data
 * OGP data is passed from server-side via markdownComponents context
 * No external API calls needed
 */
function LinkCardClientInner({ url, ogpData }: LinkCardClientProps) {
    let domain = '';
    try {
        domain = new URL(url).hostname;
    } catch {
        domain = url;
    }

    const displayTitle = ogpData?.title || url;
    const displayImage = ogpData?.image;
    const displayDescription = ogpData?.description;

    return (
        <figure className="not-prose retro-link-card">
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
            <figcaption>外部ページ：{domain}</figcaption>
        </figure>
    );
}

// Memoize to prevent re-renders when parent re-renders (e.g., scroll progress)
export const LinkCardClient = memo(LinkCardClientInner);
