import { useState, useEffect, ReactNode } from 'react';

export const DeferredRender = ({ children, timeout = 100 }: { children: ReactNode, timeout?: number }) => {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            // Use requestIdleCallback if available to further defer
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(() => setShouldRender(true));
            } else {
                setShouldRender(true);
            }
        }, timeout);
        return () => clearTimeout(timer);
    }, [timeout]);

    if (!shouldRender) return null;

    return <>{children}</>;
};
