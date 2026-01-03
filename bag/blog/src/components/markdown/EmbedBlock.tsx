import React, { useEffect, useRef } from 'react';
import { Github, Twitter, ArrowUpRight } from 'lucide-react';

interface EmbedBlockProps {
    type: string;
    id: string;
}

// Twitter Widgets API interface
interface TwitterWidgets {
    ready: (callback: () => void) => void;
    widgets: {
        createTweet: (
            id: string,
            container: HTMLElement,
            options?: { theme?: string; align?: string; dnt?: boolean }
        ) => Promise<HTMLElement>;
    };
}

declare global {
    interface Window {
        twttr?: TwitterWidgets;
    }
}

export const EmbedBlock: React.FC<EmbedBlockProps> = ({ type, id }) => {
    const tweetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (type === 'twitter' && tweetRef.current) {
            const container = tweetRef.current;

            const createTweet = () => {
                if (window.twttr && window.twttr.widgets && window.twttr.widgets.createTweet) {
                    // Clear any existing content
                    container.innerHTML = '';
                    window.twttr.widgets.createTweet(id, container, {
                        theme: 'light',
                        align: 'center',
                        dnt: true // Do Not Track
                    });
                }
            };

            // Check if script already exists
            const existingScript = document.getElementById('twitter-wjs');

            if (!existingScript) {
                const script = document.createElement('script');
                script.id = 'twitter-wjs';
                script.src = 'https://platform.twitter.com/widgets.js';
                script.async = true;
                script.onload = () => {
                    if (window.twttr && window.twttr.ready) {
                        window.twttr.ready(createTweet);
                    } else {
                        setTimeout(createTweet, 500);
                    }
                };
                document.body.appendChild(script);
            } else {
                if (window.twttr && window.twttr.ready) {
                    window.twttr.ready(createTweet);
                } else if (window.twttr && window.twttr.widgets) {
                    createTweet();
                } else {
                    setTimeout(createTweet, 500);
                }
            }
        }
    }, [type, id]);

    switch (type) {
        case 'youtube':
            return (
                <div className="my-10 group">
                    <div className="aspect-video w-full rounded-3xl overflow-hidden border border-black/5 shadow-2xl relative bg-black/5">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${id}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>
                </div>
            );
        case 'twitter':
            return (
                <div className="not-prose my-10 flex justify-center min-h-[200px] w-full">
                    <div ref={tweetRef} className="w-full max-w-xl flex justify-center">
                        <div className="animate-pulse flex flex-col items-center gap-4 py-12">
                            <Twitter className="text-black/10" size={32} />
                            <div className="text-xs font-bold tracking-widest uppercase text-black/20">Loading Tweet...</div>
                        </div>
                    </div>
                </div>
            );
        case 'github':
            // Official GitHub Social Preview (OGP) image URL format
            const ogpImage = `https://opengraph.githubassets.com/1/${id}`;

            return (
                <div className="not-prose my-10">
                    <a
                        href={`https://github.com/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-row items-stretch border border-black/10 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:border-black/20 hover:-translate-y-1 max-w-2xl h-32 md:h-36 relative"
                    >
                        <div className="flex-1 min-w-0 p-6 md:p-8 flex flex-col justify-center relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Github size={14} className="text-black/60" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30">GitHub</span>
                            </div>
                            <h4 className="text-base md:text-xl font-black text-black group-hover:text-accent transition-colors truncate leading-tight">
                                {id.split('/')[1]}
                            </h4>
                            <p className="mt-1 text-xs font-bold text-black/30 truncate">
                                {id.split('/')[0]}
                            </p>
                        </div>

                        <div className="w-32 md:w-60 overflow-hidden relative border-l border-black/5 bg-black/[0.03] flex-shrink-0 flex items-center justify-center p-4">
                            <img
                                src={ogpImage}
                                alt={`${id} repository`}
                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ArrowUpRight className="text-white drop-shadow-md" size={24} />
                            </div>
                        </div>
                    </a>
                </div>
            );
        default:
            return (
                <div className="my-8 p-6 rounded-2xl bg-black/5 border border-black/10 text-xs text-black/40 font-bold tracking-widest uppercase text-center italic">
                    Unsupported embed: {type} ({id})
                </div>
            );
    }
};
