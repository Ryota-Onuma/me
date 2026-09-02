import React, { useEffect, useRef, memo } from 'react';
import { assertNever } from '@/lib/assertNever';

// Constants
const TWITTER_SCRIPT_LOAD_DELAY_MS = 500;

export type EmbedType = 'youtube' | 'twitter' | 'github';

interface EmbedBlockProps {
    type: EmbedType | string; // Accept string for forward compatibility
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

const EmbedBlockInner: React.FC<EmbedBlockProps> = ({ type, id }) => {
    const tweetRef = useRef<HTMLDivElement>(null);
    const tweetMountedRef = useRef(false);

    useEffect(() => {
        if (type === 'twitter' && tweetRef.current && !tweetMountedRef.current) {
            const container = tweetRef.current;

            const createTweet = () => {
                if (window.twttr && window.twttr.widgets && window.twttr.widgets.createTweet) {
                    // Only create if not already mounted
                    if (!tweetMountedRef.current) {
                        container.innerHTML = '';
                        window.twttr.widgets.createTweet(id, container, {
                            theme: 'light',
                            align: 'center',
                            dnt: true // Do Not Track
                        }).then(() => {
                            tweetMountedRef.current = true;
                        }).catch((err) => {
                            console.error('Failed to create tweet:', err);
                        });
                    }
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
                        setTimeout(createTweet, TWITTER_SCRIPT_LOAD_DELAY_MS);
                    }
                };
                document.body.appendChild(script);
            } else {
                if (window.twttr && window.twttr.ready) {
                    window.twttr.ready(createTweet);
                } else if (window.twttr && window.twttr.widgets) {
                    createTweet();
                } else {
                    setTimeout(createTweet, TWITTER_SCRIPT_LOAD_DELAY_MS);
                }
            }
        }
    }, [type, id]);

    switch (type) {
        case 'youtube':
            return (
                <figure className="not-prose retro-embed retro-video-embed">
                    <iframe
                        src={`https://www.youtube.com/embed/${id}`}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                    <figcaption>YouTube / {id}</figcaption>
                </figure>
            );
        case 'twitter':
            return (
                <figure className="not-prose retro-embed retro-twitter-embed">
                    <div ref={tweetRef}>
                        <p>投稿を読み込み中...</p>
                    </div>
                    <figcaption>X の埋め込み投稿 / {id}</figcaption>
                </figure>
            );
        case 'github':
            // Official GitHub Social Preview (OGP) image URL format
            const ogpImage = `https://opengraph.githubassets.com/1/${id}`;

            return (
                <figure className="not-prose retro-embed">
                    <a
                        href={`https://github.com/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="retro-github-card"
                    >
                        <div>
                            <small>GitHub repository</small>
                            <strong>{id.split('/')[1]}</strong>
                            <span>{id.split('/')[0]}</span>
                        </div>
                        {/* External GitHub preview image has a dynamic URL. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ogpImage} alt="" />
                    </a>
                    <figcaption>GitHub リポジトリ / {id}</figcaption>
                </figure>
            );
        default:
            // This case handles unsupported embeds safely while providing exhaustive checks for known types
            return (
                <div className="retro-alert">
                    <b>Unsupported embed:</b> {type} ({id})
                    {/* Still perform exhaustive check for defined EmbedType */}
                    {typeof type !== 'string' && assertNever(type as never)}
                </div>
            );
    }
};

// Memoize to prevent re-renders when parent re-renders (e.g., scroll progress)
export const EmbedBlock = memo(EmbedBlockInner);
