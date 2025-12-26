import { useState, useEffect, ReactNode } from 'react';

interface DeferredRenderProps {
    children: ReactNode;
    timeout?: number;
}

export const DeferredRender = ({ children, timeout = 100 }: DeferredRenderProps) => {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            // Use requestIdleCallback if available to further defer
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => setShouldRender(true));
            } else {
                setShouldRender(true);
            }
        }, timeout);
        return () => clearTimeout(timer);
    }, [timeout]);

    if (!shouldRender) return null;

    return <>{children}</>;
};
