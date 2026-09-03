'use client';

import { useEffect } from 'react';
import { trackAnalyticsEvent, type AnalyticsEventName, type AnalyticsProperties } from '@/lib/analytics';

export function AnalyticsEvent({ name, properties }: { name: AnalyticsEventName; properties?: AnalyticsProperties }) {
    useEffect(() => {
        trackAnalyticsEvent(name, properties);
    }, [name, properties]);

    return null;
}
