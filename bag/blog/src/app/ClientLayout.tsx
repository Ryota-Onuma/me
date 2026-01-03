'use client';

import { useState } from 'react';
import { Header, Footer, MobileMenu } from '@/components/layout';
import { NoiseOverlay, Spotlight } from '@/components/effects';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useHasScrolled } from '@/hooks/useHasScrolled';

const NAV_LINKS = ['about', 'blog', 'scrap'];

interface ClientLayoutProps {
    children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollProgress } = useScrollProgress();
    const { isScrolled } = useHasScrolled();

    return (
        <>
            <NoiseOverlay />
            <Spotlight />

            <ProgressBar scrollProgress={scrollProgress} />

            <Header
                isScrolled={isScrolled}
                navLinks={NAV_LINKS}
                onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
            />

            {children}

            <Footer />

            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                navLinks={NAV_LINKS}
            />
        </>
    );
}
