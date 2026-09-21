import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClientLayout } from '../ClientLayout';
import { ScrapSection } from '@/components/sections/ScrapSection';
import { getAllScrapItems } from '@/lib/scraps';

const title = '雑記帳 | ryota.onuma.dev';
const description = '小さなメモ、実験、考え途中の記録。';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: '/scrap' },
    openGraph: { title, description, url: '/scrap', type: 'website', images: ['/og.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
};

export default function ScrapListPage() {
    const scraps = getAllScrapItems();

    return (
        <ClientLayout activePath="/scrap">
            <main id="main-content" tabIndex={-1}>
                <Suspense fallback={<p className="retro-loading" role="status">雑記帳を読み込み中...</p>}>
                    <ScrapSection scraps={scraps} />
                </Suspense>
            </main>
        </ClientLayout>
    );
}
