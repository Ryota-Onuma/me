'use client';

import { useEffect, useRef } from 'react';

const TWITTER_SCRIPT_LOAD_DELAY_MS = 500;

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

export function TwitterEmbed({ id }: { id: string }) {
    const tweetRef = useRef<HTMLDivElement>(null);
    const tweetMountedRef = useRef(false);

    useEffect(() => {
        if (!tweetRef.current || tweetMountedRef.current) return;
        const container = tweetRef.current;

        const createTweet = () => {
            if (!window.twttr?.widgets?.createTweet || tweetMountedRef.current) return;
            container.innerHTML = '';
            window.twttr.widgets.createTweet(id, container, {
                theme: 'light',
                align: 'center',
                dnt: true,
            }).then(() => {
                tweetMountedRef.current = true;
            }).catch((error) => {
                console.error('Failed to create tweet:', error);
            });
        };

        const existingScript = document.getElementById('twitter-wjs');
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'twitter-wjs';
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.onload = () => {
                if (window.twttr?.ready) window.twttr.ready(createTweet);
                else setTimeout(createTweet, TWITTER_SCRIPT_LOAD_DELAY_MS);
            };
            document.body.appendChild(script);
        } else if (window.twttr?.ready) {
            window.twttr.ready(createTweet);
        } else if (window.twttr?.widgets) {
            createTweet();
        } else {
            setTimeout(createTweet, TWITTER_SCRIPT_LOAD_DELAY_MS);
        }
    }, [id]);

    return (
        <div ref={tweetRef}>
            <p>投稿を読み込み中...</p>
        </div>
    );
}
