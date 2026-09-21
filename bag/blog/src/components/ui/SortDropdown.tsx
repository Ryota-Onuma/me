'use client';

import { ArrowUpDown } from 'lucide-react';
import type { SortOption } from '@/hooks/useLibraryFilter';

interface SortDropdownProps {
    value: SortOption;
    onChange: (option: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'readDate-newest', label: 'Newest First' },
    { value: 'readDate-oldest', label: 'Oldest First' },
    { value: 'rating-high', label: 'Highest Rated' },
    { value: 'rating-low', label: 'Lowest Rated' },
];

export const SortDropdown = ({ value, onChange }: SortDropdownProps) => {
    return (
        <div className="relative group">
            <div className="flex items-center gap-2 px-4 py-3 bg-white border border-black/10 rounded-md text-sm text-black cursor-pointer hover:border-black/25 transition-all">
                <ArrowUpDown className="w-4 h-4 text-black/35 group-hover:text-black/60 transition-colors" />
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value as SortOption)}
                    className="bg-transparent outline-none cursor-pointer appearance-none pr-2"
                >
                    {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};
