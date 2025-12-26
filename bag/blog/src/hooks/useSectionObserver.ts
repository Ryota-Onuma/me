import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * useSectionObserver - 画面内のセクションを監視し、現在のアクティブなセクションを返す
 * @returns { activeSection: string, setActiveSection: (id: string) => void }
 */
export const useSectionObserver = () => {
    const [activeSection, setActiveSection] = useState(() => {
        const hash = window.location.hash.replace('#', '');
        return hash || 'home';
    });
    const location = useLocation();

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '-80px 0px -20% 0px'
        });

        document.querySelectorAll('section[id]').forEach((s) => observer.observe(s));

        return () => {
            observer.disconnect();
        };
    }, [location.pathname]);

    return { activeSection, setActiveSection };
};
