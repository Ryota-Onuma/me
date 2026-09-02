import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: '*', allow: '/' },
        sitemap: 'https://ryota.onuma.dev/sitemap.xml',
        host: 'https://ryota.onuma.dev',
    };
}
