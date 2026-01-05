import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface DetailsBlockProps {
    title?: string;
    children: React.ReactNode;
}

export const DetailsBlock: React.FC<DetailsBlockProps> = ({ title = 'Details', children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="my-6 border border-black/10 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-black/[0.02] transition-colors cursor-pointer"
            >
                <span className="font-bold text-sm tracking-tight">{title}</span>
                <ChevronRight
                    size={18}
                    className={`text-black/30 transition-transform duration-300 ${isOpen ? 'rotate-90 text-black' : ''}`}
                />
            </button>
            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100 border-t border-black/5' : 'max-h-0 opacity-0'
                    } overflow-hidden`}
            >
                <div className="p-6 prose-sm md:prose-base leading-relaxed text-black/70 prose-light">
                    {children}
                </div>
            </div>
        </div>
    );
};

