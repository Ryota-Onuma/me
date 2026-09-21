'use client';

import { Header, Footer } from '@/components/layout';




interface ClientLayoutProps {
    children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
    return (
        <>
            <Header />

            {children}

            <Footer />
        </>
    );
}
