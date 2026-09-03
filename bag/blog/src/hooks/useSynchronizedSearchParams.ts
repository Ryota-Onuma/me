'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Read App Router params and also react to native history updates.
 *
 * Archive filters use the History API so typing and facet changes do not
 * queue a server navigation. Next's router still owns the initial render;
 * this small bridge makes pushState/replaceState and Back/Forward reactive.
 */
export function useSynchronizedSearchParams(): URLSearchParams {
    const routerParams = useSearchParams();
    const [historyQuery, setHistoryQuery] = useState<string | null>(null);

    useEffect(() => {
        const syncFromHistory = () => setHistoryQuery(window.location.search.slice(1));
        window.addEventListener('popstate', syncFromHistory);
        return () => window.removeEventListener('popstate', syncFromHistory);
    }, []);

    return useMemo(
        () => historyQuery === null ? routerParams : new URLSearchParams(historyQuery),
        [historyQuery, routerParams]
    );
}
