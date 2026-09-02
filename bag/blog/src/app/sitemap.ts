import type { MetadataRoute } from 'next';
import { getAllContents } from '@/lib/posts';
import { getAllScrapItems } from '@/lib/scraps';
import { getAllBookItems } from '@/lib/books';
import { getAllThemeSlugs } from '@/lib/content';

const ORIGIN = 'https://ryota.onuma.dev';

const toDate = (value?: string): Date | undefined => {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
};

export default function sitemap(): MetadataRoute.Sitemap {
    const staticPages: MetadataRoute.Sitemap = ['', '/blog', '/scrap', '/library', '/themes'].map(path => ({
        url: `${ORIGIN}${path}`,
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1 : 0.8,
    }));

    const posts: MetadataRoute.Sitemap = getAllContents()
        .filter(item => item.type === 'internal' && item.slug)
        .map(item => ({
            url: `${ORIGIN}/blog/${item.slug}`,
            lastModified: toDate(item.date),
            changeFrequency: 'yearly',
            priority: 0.7,
        }));

    const scraps: MetadataRoute.Sitemap = getAllScrapItems().map(item => ({
        url: `${ORIGIN}/scrap/${item.slug}`,
        lastModified: toDate(item.lastUpdated),
        changeFrequency: item.status === 'open' ? 'monthly' : 'yearly',
        priority: 0.6,
    }));

    const books: MetadataRoute.Sitemap = getAllBookItems().filter(item => item.hasNotes).map(item => ({
        url: `${ORIGIN}/library/${item.slug}`,
        lastModified: toDate(item.readDate),
        changeFrequency: item.status === 'reading' ? 'monthly' : 'yearly',
        priority: 0.5,
    }));

    const themes: MetadataRoute.Sitemap = getAllThemeSlugs().map(slug => ({
        url: `${ORIGIN}/themes/${slug}`,
        changeFrequency: 'monthly',
        priority: 0.7,
    }));

    return [...staticPages, ...posts, ...scraps, ...books, ...themes];
}
