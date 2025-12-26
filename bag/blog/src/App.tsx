import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import { NoiseOverlay, Spotlight } from './components/effects';
import { Header, Footer, MobileMenu } from './components/layout';
import { HeroSection, AboutSection, WorksSection } from './components/sections';

import { Suspense, lazy } from 'react';
const BlogListPage = lazy(() => import('./components/pages/BlogListPage').then(module => ({ default: module.BlogListPage })));
const BlogDetail = lazy(() => import('./components/sections/BlogDetail').then(module => ({ default: module.BlogDetail })));

import { ProgressBar } from './components/ui';

import { useScrollProgress } from './hooks/useScrollProgress';
import { useHasScrolled } from './hooks/useHasScrolled';
import { useHashScroll } from './hooks/useHashScroll';
import { useSectionObserver } from './hooks/useSectionObserver';

import { DeferredRender } from './components/utils/DeferredRender';

const NAV_LINKS = ['home', 'about', 'blog'];

interface MainContentProps {
    activeSection: string;
    onMobileMenuOpen: () => void;
    isScrolled: boolean;
    scrollProgress: number;
}

const MainContent = ({ activeSection, onMobileMenuOpen, isScrolled, scrollProgress }: MainContentProps): JSX.Element => {
    return (
        <>
            <DeferredRender timeout={100}>
                <NoiseOverlay />
                <Spotlight />
            </DeferredRender>

            <ProgressBar scrollProgress={scrollProgress} />

            <Header
                isScrolled={isScrolled}
                activeSection={activeSection}
                navLinks={NAV_LINKS}
                onMobileMenuOpen={onMobileMenuOpen}
            />

            <HeroSection />
            <AboutSection />
            <WorksSection />

            <Footer />
        </>
    );
};

function App(): JSX.Element {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { activeSection } = useSectionObserver();
    const { scrollProgress } = useScrollProgress();
    const { isScrolled } = useHasScrolled();
    useHashScroll();

    return (
        <div className="bg-[#050505] text-[#f0f0f0] font-sans overflow-x-hidden min-h-screen">
            <Routes>
                <Route path="/" element={
                    <MainContent
                        activeSection={activeSection}
                        onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
                        isScrolled={isScrolled}
                        scrollProgress={scrollProgress}
                    />
                } />
                <Route path="/blog" element={
                    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
                        <BlogListPage onMobileMenuOpen={() => setIsMobileMenuOpen(true)} />
                    </Suspense>
                } />
                <Route path="/blog/:slug" element={
                    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
                        <BlogDetail onMobileMenuOpen={() => setIsMobileMenuOpen(true)} />
                    </Suspense>
                } />
            </Routes>

            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                navLinks={NAV_LINKS}
            />
        </div>
    );
}

export default App;
