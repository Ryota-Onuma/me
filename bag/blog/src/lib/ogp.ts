export interface OGPData {
    title?: string;
    description?: string;
    image?: string;
    logo?: string;
    siteName?: string;
}

/**
 * Fetch OGP metadata from a URL
 * This runs at build time (SSG) so no CORS issues
 */
export async function fetchOGP(url: string): Promise<OGPData> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; OGPFetcher/1.0)',
                },
            });

            if (!response.ok) {
                return {};
            }

            // Keep the abort timer active until the body has finished streaming.
            const html = await response.text();

        // Helper to extract meta content
        const getMetaContent = (property: string): string | undefined => {
            // Try property attribute first (og:, twitter:)
            let match = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
            if (match) return decodeHTMLEntities(match[1]);

            // Try name attribute
            match = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
            if (match) return decodeHTMLEntities(match[1]);

            // Try reversed order (content before property)
            match = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i'));
            if (match) return decodeHTMLEntities(match[1]);

            return undefined;
        };

        // Try to get favicon
        const getFavicon = (): string | undefined => {
            const iconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i);
            if (iconMatch) {
                const iconUrl = iconMatch[1];
                if (iconUrl.startsWith('http')) return iconUrl;
                if (iconUrl.startsWith('//')) return `https:${iconUrl}`;
                if (iconUrl.startsWith('/')) {
                    const urlObj = new URL(url);
                    return `${urlObj.origin}${iconUrl}`;
                }
            }
            // Fallback to favicon.ico
            try {
                const urlObj = new URL(url);
                return `${urlObj.origin}/favicon.ico`;
            } catch {
                return undefined;
            }
        };

            return {
                title: getMetaContent('og:title') || getMetaContent('twitter:title') || getTitleFromHTML(html),
                description: getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description'),
                image: getMetaContent('og:image') || getMetaContent('twitter:image'),
                siteName: getMetaContent('og:site_name'),
                logo: getFavicon(),
            };
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (error) {
        console.warn(`Failed to fetch OGP for ${url}:`, error);
        return {};
    }
}

function decodeHTMLEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
}

function getTitleFromHTML(html: string): string | undefined {
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match ? decodeHTMLEntities(match[1].trim()) : undefined;
}
