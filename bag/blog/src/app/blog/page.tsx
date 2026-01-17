import { Suspense } from 'react';
import { ClientLayout } from '../ClientLayout';
import { WorksSection } from '@/components/sections/WorksSection';
import { getAllContents } from '@/lib/posts';

export default function BlogListPage() {
    // Server-side data fetching
    const contents = getAllContents();

    return (
        <ClientLayout>
            <main>
                <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
                    <WorksSection contents={contents} />
                </Suspense>
            </main>
        </ClientLayout>
    );
}
