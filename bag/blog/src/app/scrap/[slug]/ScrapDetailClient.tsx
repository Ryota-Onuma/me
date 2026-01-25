'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { useState, useMemo } from 'react';

import remarkDirective from 'remark-directive';
import remarkGemoji from 'remark-gemoji';
import { remarkCustomDirectives } from '@/lib/remarkCustomDirectives';
import { createMarkdownComponents } from '@/lib/markdownComponents';
import type { OGPData } from '@/lib/prefetchOGP';

import { Header, Footer } from '@/components/layout';
import { NoiseOverlay, Spotlight } from '@/components/effects';

import type { Scrap } from '@/lib/scraps';




interface ScrapDetailClientProps {
    scrap: Scrap;
    ogpDataMap?: Record<string, OGPData>;
}

export function ScrapDetailClient({ scrap, ogpDataMap }: ScrapDetailClientProps) {

    // Memoize markdown components to prevent re-mounting on scroll
    const markdownComponents = useMemo(
        () => createMarkdownComponents(ogpDataMap),
        [ogpDataMap]
    );

    return (
        <>
            <NoiseOverlay />
            <Spotlight />

            <Header />

            <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">
                <main className="min-h-screen animate-fade-in relative z-10 pt-32">
                    {/* Hero Section */}
                    <div className="px-6 md:px-24 mb-12">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-4xl">{scrap.frontmatter.emoji}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${scrap.frontmatter.status === 'open'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {scrap.frontmatter.status}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                                {scrap.frontmatter.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-black/50">
                                <span>{scrap.frontmatter.date}</span>
                                <span>•</span>
                                <span>{scrap.threads.length} threads</span>
                            </div>
                            {scrap.frontmatter.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {scrap.frontmatter.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-black/5 rounded-full text-xs font-medium text-black/60">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Threads */}
                    <div className="px-6 md:px-24 pb-24">
                        <div className="max-w-3xl mx-auto space-y-8">
                            {scrap.threads.map((thread, index) => (
                                <div key={thread.id} className="relative">
                                    {/* Thread connector line */}
                                    {index < scrap.threads.length - 1 && (
                                        <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-black/10" />
                                    )}

                                    <div className="relative bg-white rounded-2xl border border-black/10 p-6 shadow-sm">
                                        {/* Thread number indicator */}
                                        <div className="absolute -left-3 top-6 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </div>

                                        {thread.timestamp && (
                                            <div className="text-xs text-black/40 mb-4 font-mono">
                                                {thread.timestamp}
                                            </div>
                                        )}

                                        <div className="prose prose-sm prose-headings:font-bold prose-headings:tracking-tight prose-a:text-black prose-a:decoration-black/30 hover:prose-a:decoration-black prose-code:text-black prose-code:before:content-none prose-code:after:content-none prose-img:rounded-xl prose-img:border prose-img:border-black/10 prose-light">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkGemoji, remarkCustomDirectives]}
                                                rehypePlugins={[rehypeKatex, rehypeRaw]}
                                                components={markdownComponents}
                                            >
                                                {thread.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            <Footer />

        </>
    );
}
