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

// Utils
import { DeferredRender } from './components/utils/DeferredRender';

const NAV_LINKS = ['home', 'about', 'blog'];

const MainContent = ({ activeSection, onMobileMenuOpen, isScrolled, isMobileMenuOpen, setIsMobileMenuOpen, scrollProgress }: any) => {
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
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();

    const { scrollProgress } = useScrollProgress();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('section[id]').forEach((s) => observer.observe(s));
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
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
