import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Effects
import { NoiseOverlay, Spotlight } from './components/effects';

// Layout
import { Header, Footer, MobileMenu } from './components/layout';

// Sections
import { HeroSection, AboutSection, WorksSection } from './components/sections';

// Pages
import { Suspense, lazy } from 'react';
const BlogListPage = lazy(() => import('./components/pages/BlogListPage').then(module => ({ default: module.BlogListPage })));
const BlogDetail = lazy(() => import('./components/sections/BlogDetail').then(module => ({ default: module.BlogDetail })));

// UI
import { ProgressBar } from './components/ui';

// Hooks
import { useScrollProgress } from './hooks/useScrollProgress';
import { useHasScrolled } from './hooks/useHasScrolled';
import { useHashScroll } from './hooks/useHashScroll';

// Utils
import { DeferredRender } from './components/utils/DeferredRender';

const NAV_LINKS = ['home', 'about', 'blog'];

interface MainContentProps {
    activeSection: string;
    onMobileMenuOpen: () => void;
    isScrolled: boolean;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    scrollProgress: number;
}

const MainContent = ({ activeSection, onMobileMenuOpen, isScrolled, isMobileMenuOpen, setIsMobileMenuOpen, scrollProgress }: MainContentProps) => {
    return (
        <>
            {/* Deferred Background Effects - Priorities Content First */}
            <DeferredRender timeout={100}>
                <NoiseOverlay />
                <Spotlight />
            </DeferredRender>

            {/* Progress Bar */}
            <ProgressBar scrollProgress={scrollProgress} />

            {/* Navigation */}
            <Header
                isScrolled={isScrolled}
                activeSection={activeSection}
                navLinks={NAV_LINKS}
                onMobileMenuOpen={onMobileMenuOpen}
            />

            {/* Sections */}
            <HeroSection />
            <AboutSection />
            <WorksSection />

            {/* Footer */}
            <Footer />

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                navLinks={NAV_LINKS}
            />
        </>
    );
};

function App() {
    const [activeSection, setActiveSection] = useState('home');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const { scrollProgress } = useScrollProgress();
    const { isScrolled } = useHasScrolled();
    useHashScroll();

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '-80px 0px -20% 0px' // Match corrected scroll offset
        });

        document.querySelectorAll('section[id]').forEach((s) => observer.observe(s));

        return () => {
            observer.disconnect();
        };
    }, [location.pathname]);

    return (
        <div className="bg-[#050505] text-[#f0f0f0] font-sans overflow-x-hidden min-h-screen">
            <Routes>
                <Route path="/" element={
                    <MainContent
                        activeSection={activeSection}
                        onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
                        isScrolled={isScrolled}
                        isMobileMenuOpen={isMobileMenuOpen}
                        setIsMobileMenuOpen={setIsMobileMenuOpen}
                        scrollProgress={scrollProgress}
                    />
                } />
                <Route path="/blog" element={
                    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
                        <BlogListPage />
                    </Suspense>
                } />
                <Route path="/blog/:slug" element={
                    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
                        <BlogDetail />
                    </Suspense>
                } />
            </Routes>
        </div>
    );
}

export default App;
