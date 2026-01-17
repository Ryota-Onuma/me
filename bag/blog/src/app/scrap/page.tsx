import { Suspense } from 'react';
import { ClientLayout } from '../ClientLayout';
import { ScrapSection } from '@/components/sections/ScrapSection';
import { getAllScrapItems } from '@/lib/scraps';

export default function ScrapListPage() {
    const scraps = getAllScrapItems();

    return (
        <ClientLayout>
            <main>
                <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
                    <ScrapSection scraps={scraps} />
                </Suspense>
            </main>
        </ClientLayout>
    );
}
