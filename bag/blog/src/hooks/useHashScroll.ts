import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToSection } from '../utils/scroll';

/**
 * Hook to handle hash-based scrolling on route/hash change
 */
export const useHashScroll = () => {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        // If we are at the root and there's a hash, scroll to that section
        if (pathname === '/' && hash) {
            const sectionId = hash.replace('#', '');
            // Small delay to ensure DOM is ready after route transition
            const timer = setTimeout(() => {
                scrollToSection(sectionId);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [pathname, hash]);
};
