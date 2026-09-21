import React from 'react';

interface DetailsBlockProps {
    title?: string;
    children: React.ReactNode;
}

export const DetailsBlock: React.FC<DetailsBlockProps> = ({ title = 'Details', children }) => {
    return (
        <details className="retro-details">
            <summary>{title}</summary>
            <div className="retro-details-content">{children}</div>
        </details>
    );
};
