'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

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
            onClick={handleCopy}
            className={`cursor-pointer p-1.5 rounded-md transition-all duration-200 ${className || 'text-white/70 hover:text-white hover:bg-white/10'}`}
            title="Copy code"
        >
            {copied ? (
                <Check size={14} className="text-green-400" />
            ) : (
                <Copy size={14} />
            )}
        </button>
    );
};
