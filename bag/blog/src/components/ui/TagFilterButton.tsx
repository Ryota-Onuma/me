'use client';

interface TagFilterButtonProps {
    tag: string | null;
    label: string;
    isSelected: boolean;
    onClick: () => void;
}

/**
 * Reusable tag filter button component
 * Shared between WorksSection and ScrapSection
 */
export const TagFilterButton = ({ label, isSelected, onClick }: Omit<TagFilterButtonProps, 'tag'>) => {
    const baseClasses = 'cursor-pointer px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap';
    const selectedClasses = 'bg-accent text-white border-accent shadow-[0_0_20px_rgba(118,181,197,0.3)]';
    const unselectedClasses = 'bg-transparent text-black/40 border-black/10 hover:border-accent/40 hover:text-accent';

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}
        >
            {label}
        </button>
    );
};
