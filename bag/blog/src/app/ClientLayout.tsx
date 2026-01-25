'use client';

import { useState } from 'react';
import { Header, Footer } from '@/components/layout';
import { NoiseOverlay, Spotlight } from '@/components/effects';




interface ClientLayoutProps {
    children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
    return (
        <>
            <NoiseOverlay />
            <Spotlight />

            <Header />

            {children}

            <Footer />
        </>
    );
}
