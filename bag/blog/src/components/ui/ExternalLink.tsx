'use client';

import type { ReactNode } from 'react';
import { trackAnalyticsEvent, type AnalyticsEventName, type AnalyticsProperties } from '@/lib/analytics';

interface ExternalLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    showIndicator?: boolean;
    eventName?: AnalyticsEventName;
    eventProperties?: AnalyticsProperties;
}

export function ExternalLink({ href, children, className, showIndicator = true, eventName, eventProperties }: ExternalLinkProps) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            onClick={() => eventName && trackAnalyticsEvent(eventName, eventProperties)}
        >
            {children}
            {showIndicator && <small className="retro-external-indicator" aria-hidden="true"> ［外部］</small>}
            <span className="sr-only">（新しいタブで開きます）</span>
        </a>
    );
}
