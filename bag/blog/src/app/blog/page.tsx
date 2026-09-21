import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClientLayout } from '../ClientLayout';
import { WorksSection } from '@/components/sections/WorksSection';
import { getAllContents } from '@/lib/posts';

const title = '技術ノート | ryota.onuma.dev';
const description = '技術記事、仕事の記録、考えたこと。';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: '/blog' },
    openGraph: { title, description, url: '/blog', type: 'website', images: ['/og.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
};

export default function BlogListPage() {
    // Server-side data fetching
    const contents = getAllContents();

    return (
        <ClientLayout activePath="/blog">
            <main id="main-content" tabIndex={-1}>
                <Suspense fallback={<p className="retro-loading" role="status">記事一覧を読み込み中...</p>}>
                    <WorksSection contents={contents} />
                </Suspense>
            </main>
        </ClientLayout>
    );
}
