export type AnalyticsEventName =
    | 'content_open'
    | 'theme_open'
    | 'related_click'
    | 'filter_use'
    | 'rss_click'
    | 'external_article_click'
    | 'contact_click';

export type AnalyticsProperties = Record<string, string | number | boolean | undefined>;

export const ANALYTICS_BROWSER_EVENT = 'ryota:analytics';

/**
 * Vendor-neutral event boundary. A future analytics adapter can subscribe to
 * this browser event without coupling UI components to a specific provider.
 */
export function trackAnalyticsEvent(name: AnalyticsEventName, properties: AnalyticsProperties = {}) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(ANALYTICS_BROWSER_EVENT, {
        detail: { name, properties },
    }));
}
