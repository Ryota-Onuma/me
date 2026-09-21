import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClientLayout } from '../ClientLayout';
import { LibrarySection } from '@/components/sections/LibrarySection';
import { getAllBookItems } from '@/lib/books';

const title = '読書記録 | ryota.onuma.dev';
const description = '読んだ本と、そこから得た学びの記録。';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: '/library' },
    openGraph: { title, description, url: '/library', type: 'website', images: ['/og.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
};

export default function LibraryPage() {
    const books = getAllBookItems();

    return (
        <ClientLayout activePath="/library">
            <main id="main-content" tabIndex={-1}>
                <Suspense fallback={<p className="retro-loading" role="status">読書記録を読み込み中...</p>}>
                    <LibrarySection books={books} />
                </Suspense>
            </main>
        </ClientLayout>
    );
}
