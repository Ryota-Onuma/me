import React, { useState } from 'react';

interface DetailsBlockProps {
    title?: string;
    children: React.ReactNode;
}

export const DetailsBlock: React.FC<DetailsBlockProps> = ({ title = 'Details', children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="retro-details">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span>{isOpen ? '▼' : '▶'} {title}</span>
            </button>
            {isOpen && <div className="retro-details-content">{children}</div>}
        </div>
    );
};
