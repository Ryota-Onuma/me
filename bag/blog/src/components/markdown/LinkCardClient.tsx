'use client';

import { useState, useEffect } from 'react';
import { Globe, ArrowUpRight } from 'lucide-react';

interface LinkCardClientProps {
    url: string;
}

interface Metadata {
    title?: string;
    description?: string;
    image?: string;
    logo?: string;
}

/**
 * Client-side LinkCard that fetches OGP data
 * Used within markdown rendering which is a client component
 * Falls back to simple link display if fetch fails
 */
export function LinkCardClient({ url }: LinkCardClientProps) {
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [loading, setLoading] = useState(true);

    let domain = '';
    try {
        domain = new URL(url).hostname;
    } catch {
        domain = url;
    }

    useEffect(() => {
        let isMounted = true;

        const fetchMetadata = async () => {
            try {
                // Use microlink as fallback for client-side fetching
                const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                if (isMounted && data.status === 'success') {
                    setMetadata({
                        title: data.data.title,
                        description: data.data.description,
                        image: data.data.image?.url,
                        logo: data.data.logo?.url
                    });
                }
            } catch (error) {
                console.error('Error fetching metadata:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchMetadata();
        return () => { isMounted = false; };
    }, [url]);

    const displayTitle = metadata?.title || url;
    const displayImage = metadata?.image;
    const displayDescription = metadata?.description;

    return (
        <div className="not-prose my-10">
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-row border border-black/10 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:border-black/20 hover:-translate-y-1 max-w-2xl h-36 md:h-40 relative"
            >
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center min-w-0 overflow-hidden relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        {metadata?.logo ? (
                            <img src={metadata.logo} alt="" className="w-4 h-4 rounded-sm object-contain flex-shrink-0" />
                        ) : (
                            <div className="w-4 h-4 rounded-sm bg-black/5 flex items-center justify-center flex-shrink-0">
                                <Globe size={10} className="text-black/30" />
                            </div>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 truncate">{domain}</span>
                    </div>

                    <h4 className="text-base md:text-lg font-black text-black group-hover:text-accent transition-colors line-clamp-2 leading-tight mb-2">
                        {loading ? (
                            <span className="inline-block w-full h-6 bg-black/5 animate-pulse rounded" />
                        ) : displayTitle}
                    </h4>

                    {!loading && displayDescription && (
                        <p className="text-xs md:text-sm font-medium text-black/40 line-clamp-1 leading-relaxed">
                            {displayDescription}
                        </p>
                    )}
                </div>

                {!loading && displayImage && (
                    <div className="w-32 md:w-52 flex-shrink-0 overflow-hidden relative border-l border-black/5 bg-black/[0.03] flex items-center justify-center p-4 md:p-6">
                        <img
                            src={displayImage}
                            alt=""
                            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ArrowUpRight className="text-white drop-shadow-md" size={24} />
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="w-32 md:w-48 flex-shrink-0 bg-black/5 animate-pulse border-l border-black/5" />
                )}
            </a>
        </div>
    );
}
