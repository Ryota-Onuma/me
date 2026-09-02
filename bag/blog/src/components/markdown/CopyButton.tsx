'use client';

import React, { useState } from 'react';

interface CopyButtonProps {
    text: string;
    className?: string;
}

export const CopyButton = ({ text, className }: CopyButtonProps): React.ReactNode => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (): Promise<void> => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={`retro-copy-button${className ? ` ${className}` : ''}`}
            title="コードをコピー"
        >
            {copied ? 'コピー済み' : 'コピー'}
        </button>
    );
};
