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
    return (
        <button
            type="button"
            onClick={onClick}
            className={`retro-filter-button${isSelected ? ' is-selected' : ''}`}
            aria-pressed={isSelected}
        >
            {label}
        </button>
    );
};
