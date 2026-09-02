import type { Metadata } from 'next';
import { ClientLayout } from './ClientLayout';
import { AboutSection } from '@/components/sections';
import { getAllContents } from '@/lib/posts';
import { getAllScrapItems } from '@/lib/scraps';
import { getAllBookItems } from '@/lib/books';
import { getHomeThemes, getUnifiedContent } from '@/lib/content';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  const contents = getAllContents();
  const allScraps = getAllScrapItems();
  const unified = getUnifiedContent();
  const updates = unified
    .filter(update => update.href)
    .slice(0, 8)
    .map(update => ({
      id: `${update.type}-${update.id}`,
      type: update.type,
      title: update.title,
      date: update.updated || update.date,
      href: update.href,
      isExternal: update.isExternal,
    }));
  const scraps = allScraps.slice(0, 4);
  const blogs = contents.slice(0, 4).map(item => ({
    id: item.id,
    title: item.title,
    href: item.type === 'external' && item.url ? item.url : `/blog/${item.slug}`,
    isExternal: item.type === 'external',
  }));
  const toTime = (value?: string) => {
    const time = value ? new Date(value).getTime() : 0;
    return Number.isNaN(time) ? 0 : time;
  };
  const books = [...getAllBookItems()]
    .sort((a, b) => {
      if (a.status === 'reading' && b.status !== 'reading') return -1;
      if (a.status !== 'reading' && b.status === 'reading') return 1;
      return toTime(b.readDate || b.updated) - toTime(a.readDate || a.updated);
    })
    .slice(0, 4);

  return (
    <ClientLayout activePath="/">
      <main id="main-content" tabIndex={-1}>
        <AboutSection updates={updates} scraps={scraps} books={books} blogs={blogs} themes={getHomeThemes()} />
      </main>
    </ClientLayout>
  );
}
