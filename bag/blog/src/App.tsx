import { useState, useEffect } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';

// Effects
import { NoiseOverlay, Spotlight } from './components/effects';

// Layout
import { Header, Footer, MobileMenu } from './components/layout';

// Sections
import { HeroSection, WorksSection, BlogDetail } from './components/sections';

// UI
import { ProgressBar } from './components/ui';

// Hooks
import { useScrollProgress } from './hooks/useScrollProgress';

const NAV_LINKS = ['home', 'works'];

const MainContent = ({ activeSection, onMobileMenuOpen, isScrolled, isMobileMenuOpen, setIsMobileMenuOpen, lightX, lightY, scaleX }: any) => {
    return (
        <>
            {/* Background Effects */}
            <NoiseOverlay />
            <Spotlight lightX={lightX} lightY={lightY} />

            {/* Progress Bar */}
            <ProgressBar scaleX={scaleX} />

            {/* Navigation */}
            <Header
                isScrolled={isScrolled}
                activeSection={activeSection}
                navLinks={NAV_LINKS}
                onMobileMenuOpen={onMobileMenuOpen}
            />

            {/* Sections */}
            <HeroSection />
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

    const { scaleX } = useScrollProgress();

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const lightX = useSpring(mouseX, { stiffness: 40, damping: 30 });
    const lightY = useSpring(mouseY, { stiffness: 40, damping: 30 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

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
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, [mouseX, mouseY, location.pathname]);

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
                        lightX={lightX}
                        lightY={lightY}
                        scaleX={scaleX}
                    />
                } />
                <Route path="/blog/:slug" element={<BlogDetail />} />
            </Routes>
        </div>
    );
}

export default App;
