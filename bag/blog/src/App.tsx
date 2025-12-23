import { useState, useEffect } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

// Effects
import { NoiseOverlay, Spotlight } from './components/effects';

// Layout
import { Header, Footer, MobileMenu } from './components/layout';

// Sections
import { HeroSection, WorksSection } from './components/sections';

// UI
import { ProgressBar } from './components/ui';

// Hooks
import { useScrollProgress } from './hooks/useScrollProgress';

const NAV_LINKS = ['home', 'works'];

/**
 * App - メインアプリケーションコンポーネント
 */
function App() {
    const [activeSection, setActiveSection] = useState('home');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

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
    }, [mouseX, mouseY]);

    return (
        <div className="bg-[#050505] text-[#f0f0f0] font-sans overflow-x-hidden min-h-screen">
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
                onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
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
        </div>
    );
}

export default App;
