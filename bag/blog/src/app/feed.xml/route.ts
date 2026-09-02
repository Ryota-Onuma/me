import { getAllContents } from '@/lib/posts';
import { getAllScrapItems } from '@/lib/scraps';
import { getAllBookItems } from '@/lib/books';

const ORIGIN = 'https://ryota.onuma.dev';

export const dynamic = 'force-static';

const escapeXml = (value: string): string => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const toTimestamp = (value: string): number => {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

export function GET() {
    const posts = getAllContents().map(item => ({
        title: item.title,
        description: item.description || `${item.category}の記事`,
        date: item.date,
        url: item.type === 'external' && item.url ? item.url : `${ORIGIN}/blog/${item.slug}`,
    }));
    const scraps = getAllScrapItems().map(item => ({
        title: item.title,
        description: `${item.tags.join('、')}についての雑記`,
        date: item.lastUpdated,
        url: `${ORIGIN}/scrap/${item.slug}`,
    }));
    const books = getAllBookItems().filter(item => item.readDate || item.updated).map(item => ({
        title: item.title,
        description: `${item.author}の読書ログ`,
        date: item.readDate || item.updated || '',
        url: item.hasNotes ? `${ORIGIN}/library/${item.slug}` : item.externalUrl,
    }));
    const items = [...posts, ...scraps, ...books]
        .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
        .slice(0, 30)
        .map(item => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`)
        .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ryota.onuma.dev</title>
    <link>${ORIGIN}</link>
    <description>Ryota Onumaの、ソフトウェアと読書の個人ページ。</description>
    <language>ja</language>${items}
  </channel>
</rss>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
    });
}
