'use client';

import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';

import remarkDirective from 'remark-directive';
import remarkGemoji from 'remark-gemoji';
import { remarkCustomDirectives } from '@/lib/remarkCustomDirectives';
import { createMarkdownComponents } from '@/lib/markdownComponents';
import type { OGPData } from '@/lib/prefetchOGP';

import { Header, Footer } from '@/components/layout';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useScrollProgress } from '@/hooks/useScrollProgress';

import { ExternalLink, Star, Calendar } from 'lucide-react';




interface ParsedBook {
    title: string;
    author: string;
    status: 'yet' | 'reading' | 'completed';
    externalUrl: string;
    tags: string[];
    cover?: string;
    readDate?: string;
    rating?: number;
    content: string;
    externalLabel?: string;
}

interface BookDetailClientProps {
    book: ParsedBook;
    ogpDataMap?: Record<string, OGPData>;
}

const STATUS_LABELS: Record<'yet' | 'reading' | 'completed', string> = {
    yet: 'Yet',
    reading: 'Reading',
    completed: 'Completed',
};

const STATUS_STYLES: Record<'yet' | 'reading' | 'completed', string> = {
    yet: 'bg-slate-100 text-slate-700 border-slate-200',
    reading: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function BookDetailClient({ book, ogpDataMap }: BookDetailClientProps) {
    const router = useRouter();
    const { scrollProgress } = useScrollProgress();

    // Memoize markdown components to prevent re-mounting on scroll
    const markdownComponents = useMemo(
        () => createMarkdownComponents(ogpDataMap),
        [ogpDataMap]
    );

    if (!book) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center text-black/50 gap-6">
                <p className="text-xl font-semibold">Book Not Found</p>
                <button
                    onClick={() => router.push('/library')}
                    className="text-xs font-medium border-b border-black/20 pb-1 hover:border-black transition-colors"
                >
                    Back to Library
                </button>
            </div>
        );
    }

    const renderStars = (rating?: number) => {
        if (!rating) return null;

        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-5 h-5 ${star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-black/20'
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <>
            <ProgressBar scrollProgress={scrollProgress} />

            <Header />

            <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">
                <main className="min-h-screen animate-fade-in relative z-10">
                    {/* Hero Section */}
                    <section className="pt-40 pb-20 px-6 md:px-24">
                        <div className="max-w-5xl mx-auto">
                            <div className="flex flex-col md:flex-row gap-12">
                                {/* Cover Image */}
                                {book.cover && (
                                    <div className="flex-shrink-0 mx-auto md:mx-0">
                                        <div className="w-60 md:w-64 aspect-[2/3] rounded-lg overflow-hidden border border-black/10 relative bg-white">
                                            <img
                                                src={book.cover}
                                                alt={book.title}
                                                className="relative w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Book Info */}
                                <div className="flex-1">
                                    {/* Status Badge */}
                                    <div className="mb-4">
                                        <span className={`inline-flex items-center gap-1.5 border text-xs px-3 py-1.5 rounded-md font-medium ${STATUS_STYLES[book.status]}`}>
                                            {STATUS_LABELS[book.status]}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-black mb-4">
                                        {book.title}
                                    </h1>

                                    {/* Author */}
                                    <p className="text-xl text-black/60 mb-6">by {book.author}</p>

                                    {/* Rating */}
                                    <div className="mb-6">
                                        {book.rating ? (
                                            <div className="flex items-center gap-3">
                                                {renderStars(book.rating)}
                                                <span className="text-sm text-black/50">
                                                    {book.rating}/5
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-black/40">Not Rated</span>
                                        )}
                                    </div>

                                    {/* Read Date */}
                                    {book.readDate && (
                                        <div className="flex items-center gap-2 mb-6">
                                            <Calendar className="w-4 h-4 text-black/40" />
                                            <span className="text-sm text-black/50">
                                                Read on {book.readDate}
                                            </span>
                                        </div>
                                    )}

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {book.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="text-xs font-medium text-black/60 px-3 py-1.5 rounded-md bg-black/5 border border-black/10"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* External Link CTA */}
                                    <a
                                        href={book.externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white rounded-md font-medium hover:bg-black/85 transition-all"
                                    >
                                        {(() => {
                                            if (book.externalLabel) return book.externalLabel;
                                            try {
                                                const url = new URL(book.externalUrl);

                                                if (url.hostname.includes('amazon') || url.hostname.includes('amzn')) {
                                                    return 'View on Amazon';
                                                }

                                                if (url.hostname.includes('gihyo')) {
                                                    return 'View on Gihyo.jp';
                                                }

                                                if (url.hostname.includes('impress')) {
                                                    return 'View on Impress';
                                                }


                                                if (url.hostname.includes('oreilly')) {
                                                    return "View on O'Reilly";
                                                }

                                                return `View on ${url.hostname}`;
                                            } catch {
                                                return 'View Details';
                                            }
                                        })()}
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Content Section */}
                    <div className="px-6 md:px-24 pb-24">
                        <div className="max-w-3xl mx-auto">
                            <div className="prose prose-lg md:prose-xl prose-headings:font-semibold prose-headings:tracking-normal prose-a:text-black prose-a:decoration-black/30 hover:prose-a:decoration-black prose-code:text-black prose-code:before:content-none prose-code:after:content-none prose-img:rounded-lg prose-img:border prose-img:border-black/10 prose-blockquote:border-none prose-blockquote:p-0 prose-light">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkGemoji, remarkCustomDirectives]}
                                    rehypePlugins={[rehypeKatex, rehypeSlug, rehypeRaw]}
                                    components={markdownComponents}
                                >
                                    {book.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <Footer />

        </>
    );
}
