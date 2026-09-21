'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { trackAnalyticsEvent, type AnalyticsEventName, type AnalyticsProperties } from '@/lib/analytics';

export function TrackedLink({
    href,
    children,
    eventName,
    properties,
    className,
}: {
    href: string;
    children: ReactNode;
    eventName: AnalyticsEventName;
    properties?: AnalyticsProperties;
    className?: string;
}) {
    return (
        <Link href={href} className={className} onClick={() => trackAnalyticsEvent(eventName, properties)}>
            {children}
        </Link>
    );
}
