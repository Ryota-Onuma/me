'use client';

import type { SortOption } from '@/hooks/useLibraryFilter';

interface SortDropdownProps {
    value: SortOption;
    onChange: (option: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'readDate-newest', label: '新しい順' },
    { value: 'readDate-oldest', label: '古い順' },
    { value: 'rating-high', label: '評価の高い順' },
    { value: 'rating-low', label: '評価の低い順' },
];

export const SortDropdown = ({ value, onChange }: SortDropdownProps) => {
    return (
        <label className="retro-sort">
            並び順：
            <select value={value} onChange={(e) => onChange(e.target.value as SortOption)}>
                {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </label>
    );
};
