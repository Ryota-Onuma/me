import { fetchOGP, type OGPData } from './ogp';

/**
 * Extract URLs from link-card directives in markdown content
 * Matches patterns like @[card](url) or :link-card{url="..."}
 */
export function extractLinkCardUrls(content: string): string[] {
    const urls: string[] = [];

    // Match @[card](url) syntax
    const cardSyntaxRegex = /@\[card\]\(([^)]+)\)/g;
    let match;
    while ((match = cardSyntaxRegex.exec(content)) !== null) {
        urls.push(match[1]);
    }

    // Match :link-card{url="..."} syntax
    const directiveRegex = /:link-card\{url="([^"]+)"\}/g;
    while ((match = directiveRegex.exec(content)) !== null) {
        urls.push(match[1]);
    }

    // Match bare URLs that become link cards (lines with only a URL)
    const lines = content.split('\n');
    const urlRegex = /^(https?:\/\/[^\s]+)$/;
    for (const line of lines) {
        const trimmed = line.trim();
        if (urlRegex.test(trimmed)) {
            urls.push(trimmed);
        }
    }

    return [...new Set(urls)]; // Remove duplicates
}

/**
 * Pre-fetch OGP data for all link-card URLs in markdown content
 * Returns a map of URL -> OGPData
 */
export async function prefetchOGPData(content: string): Promise<Record<string, OGPData>> {
    const urls = extractLinkCardUrls(content);

    if (urls.length === 0) {
        return {};
    }

    const results = await Promise.all(
        urls.map(async (url) => {
            const ogpData = await fetchOGP(url);
            return [url, ogpData] as const;
        })
    );

    return Object.fromEntries(results);
}

export type { OGPData };
