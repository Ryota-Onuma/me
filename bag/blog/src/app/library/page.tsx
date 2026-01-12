import { Suspense } from 'react';
import { ClientLayout } from '../ClientLayout';
import { LibrarySection } from '@/components/sections/LibrarySection';
import { getAllBookItems } from '@/lib/books';

export default function LibraryPage() {
    const books = getAllBookItems();

    return (
        <ClientLayout>
            <main className="pt-24">
                <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
                    <LibrarySection books={books} />
                </Suspense>
            </main>
        </ClientLayout>
    );
}
