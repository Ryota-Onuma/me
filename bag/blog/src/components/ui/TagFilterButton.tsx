'use client';

interface TagFilterButtonProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
}

/**
 * Reusable tag filter button component
 * Shared between WorksSection and ScrapSection
 */
export const TagFilterButton = ({ label, isSelected, onClick }: TagFilterButtonProps) => {
    const baseClasses = 'cursor-pointer px-3 py-2 rounded-md text-xs font-medium border transition-all whitespace-nowrap';
    const selectedClasses = 'bg-black text-white border-black';
    const unselectedClasses = 'bg-white text-black/55 border-black/10 hover:border-black/25 hover:text-black';

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}
        >
            {label}
        </button>
    );
};
