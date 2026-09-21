import type { Metadata } from 'next';
import { ClientLayout } from '../ClientLayout';
import { ThemesSection } from '@/components/sections';
import { getThemeEntries } from '@/lib/content';

const title = 'テーマ | ryota.onuma.dev';
const description = '技術ノート・雑記帳・読書記録を横断して、関心の育ち方をたどるテーマ一覧。';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: '/themes' },
    openGraph: { title, description, url: '/themes', type: 'website', images: ['/og.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
};

export default function ThemesPage() {
    return (
        <ClientLayout activePath="/themes">
            <main id="main-content" tabIndex={-1}>
                <ThemesSection themes={getThemeEntries()} />
            </main>
        </ClientLayout>
    );
}
