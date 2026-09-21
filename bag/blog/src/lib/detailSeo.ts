const SITE_ORIGIN = 'https://ryota.onuma.dev';

export const SITE_AUTHOR = {
    name: 'Ryota Onuma',
    url: `${SITE_ORIGIN}/`,
} as const;

export function toIsoDate(value?: string): string | undefined {
    if (!value) return undefined;
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
}

export function absoluteSiteUrl(value: string): string {
    return new URL(value, SITE_ORIGIN).toString();
}

export function serializeJsonLd(value: unknown): string {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}
