import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import { NoiseOverlay, Spotlight } from './components/effects';
import { Header, Footer, MobileMenu } from './components/layout';


import { Suspense, lazy } from 'react';
const BlogDetail = lazy(() => import('./components/sections/BlogDetail').then(module => ({ default: module.BlogDetail })));

import { ProgressBar } from './components/ui';

import { useScrollProgress } from './hooks/useScrollProgress';
import { useHasScrolled } from './hooks/useHasScrolled';
import { useHashScroll } from './hooks/useHashScroll';
import { useSectionObserver } from './hooks/useSectionObserver';
import { useScrollToTop } from './hooks/useScrollToTop';

import { DeferredRender } from './components/utils/DeferredRender';

const NAV_LINKS = ['about', 'blog'];

import { HomePage, BlogListPage, NotFoundPage } from './components/pages';

function App(): JSX.Element {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    useSectionObserver();
    const { scrollProgress } = useScrollProgress();
    const { isScrolled } = useHasScrolled();
    useHashScroll();
    useScrollToTop();



    return (
        <div className="bg-[#fafafa] text-[#1a1a1a] font-sans overflow-x-hidden min-h-screen">
            <DeferredRender timeout={100}>
                <NoiseOverlay />
                <Spotlight />
            </DeferredRender>

            <ProgressBar scrollProgress={scrollProgress} />

            <Header
                isScrolled={isScrolled}
                navLinks={NAV_LINKS}
                onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
            />

            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/blog" element={<BlogListPage />} />
                <Route path="/blog/:slug" element={
                    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
                        <BlogDetail />
                    </Suspense>
                } />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>

            <Footer />

            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                navLinks={NAV_LINKS}
            />
        </div>
    );
}

export default App;

