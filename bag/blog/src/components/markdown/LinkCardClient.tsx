'use client';

import { memo } from 'react';
import { Globe, ArrowUpRight } from 'lucide-react';

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
        <div className="not-prose my-10">
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-row border border-black/10 rounded-lg overflow-hidden bg-white transition-all duration-200 hover:border-black/25 max-w-2xl h-36 md:h-40 relative"
            >
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center min-w-0 overflow-hidden relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        {ogpData?.logo ? (
                            <img src={ogpData.logo} alt="" className="w-4 h-4 rounded-sm object-contain flex-shrink-0" />
                        ) : (
                            <div className="w-4 h-4 rounded-sm bg-black/5 flex items-center justify-center flex-shrink-0">
                                <Globe size={10} className="text-black/30" />
                            </div>
                        )}
                        <span className="text-xs font-medium text-black/40 truncate">{domain}</span>
                    </div>

                    <h4 className="text-base md:text-lg font-semibold text-black group-hover:text-accent-hover transition-colors line-clamp-2 leading-tight mb-2">
                        {displayTitle}
                    </h4>

                    {displayDescription && (
                        <p className="text-xs md:text-sm font-medium text-black/40 line-clamp-1 leading-relaxed">
                            {displayDescription}
                        </p>
                    )}
                </div>

                {displayImage && (
                    <div className="w-32 md:w-52 flex-shrink-0 overflow-hidden relative border-l border-black/5 bg-black/[0.03] flex items-center justify-center p-4 md:p-6">
                        <img
                            src={displayImage}
                            alt=""
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute right-3 bottom-3 bg-white border border-black/10 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="text-black/60" size={14} />
                        </div>
                    </div>
                )}
            </a>
        </div>
    );
}

// Memoize to prevent re-renders when parent re-renders (e.g., scroll progress)
export const LinkCardClient = memo(LinkCardClientInner);
