import React from 'react';
import { assertNever } from '@/lib/assertNever';
import { TwitterEmbed } from './TwitterEmbed';

export type EmbedType = 'youtube' | 'twitter' | 'github';

interface EmbedBlockProps {
    type: EmbedType | string; // Accept string for forward compatibility
    id: string;
}

export const EmbedBlock: React.FC<EmbedBlockProps> = ({ type, id }) => {
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
                        <TwitterEmbed id={id} />
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
                        <span className="sr-only">（外部ページ・新しいタブで開きます）</span>
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
