import type { Metadata } from 'next';
import { ClientLayout } from './ClientLayout';
import { AboutSection } from '@/components/sections';
import { getAllContents } from '@/lib/posts';
import { getAllScrapItems } from '@/lib/scraps';
import { getAllBookItems } from '@/lib/books';
import { getThemeEntries, getUnifiedContent } from '@/lib/content';
import { HOME_FEATURED_CONTENT_IDS, HOME_FOCUS_THEME_SLUGS, SITE_DESCRIPTION } from '@/data/site';

export const metadata: Metadata = {
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
};

export default function HomePage() {
  const contents = getAllContents();
  const allScraps = getAllScrapItems();
  const books = getAllBookItems();
  const unified = getUnifiedContent();
  const updates = unified
    .filter(update => update.href)
    .slice(0, 5)
    .map(update => ({
      id: `${update.type}-${update.id}`,
      type: update.type,
      title: update.title,
      date: update.updated || update.date,
      href: update.href,
      isExternal: update.isExternal,
      activity: update.updated && update.updated !== update.date ? '更新' : '公開',
    }));
    const featured = HOME_FEATURED_CONTENT_IDS
    .map(id => contents.find(item => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map(item => {
      const isExternal = item.type === 'external' && !item.hasContent;
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        href: isExternal && item.url ? item.url : `/blog/${item.slug}`,
        isExternal,
        category: item.category,
      };
    });
  const themeEntries = getThemeEntries();
  const themes = HOME_FOCUS_THEME_SLUGS
    .map(slug => themeEntries.find(theme => theme.slug === slug))
    .filter((theme): theme is NonNullable<typeof theme> => Boolean(theme));

  return (
    <ClientLayout activePath="/">
      <main id="main-content" tabIndex={-1}>
        <AboutSection
          updates={updates}
          featured={featured}
          themes={themes}
          archiveCounts={{ blog: contents.length, scrap: allScraps.length, library: books.length }}
        />
      </main>
    </ClientLayout>
  );
}
