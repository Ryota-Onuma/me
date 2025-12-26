/**
 * Utility for smooth scrolling to sections with header offset
 */
export const scrollToSection = (sectionId: string) => {
    if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    const element = document.getElementById(sectionId);
    if (!element) return;

    const headerOffset = 80; // Optimized for standard sticky header height
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
};
