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
            <div className="flex items-center gap-2 px-4 py-3 bg-black/[0.02] backdrop-blur-xl border border-black/10 rounded-2xl text-sm text-black cursor-pointer hover:border-accent hover:bg-accent-light transition-all">
                <ArrowUpDown className="w-4 h-4 text-black/30 group-hover:text-accent transition-colors" />
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
