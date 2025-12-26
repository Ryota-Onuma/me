import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToSection } from '../utils/scroll';

/**
 * Hook to handle hash-based scrolling on route/hash change
 */
export const useHashScroll = () => {
    const { pathname, hash } = useLocation();
    const lastPathname = useRef(pathname);

    useEffect(() => {
        if (pathname === '/' && hash) {
            const sectionId = hash.replace('#', '');
            const isNewPage = lastPathname.current !== pathname;

            if (isNewPage) {
                // Cross-page jump: Small delay to ensure DOM is ready
                const timer = setTimeout(() => {
                    scrollToSection(sectionId);
                }, 100);
                return () => clearTimeout(timer);
            } else {
                // Same-page jump: Immediate scroll
                scrollToSection(sectionId);
            }
        }

        lastPathname.current = pathname;
    }, [pathname, hash]);
};
