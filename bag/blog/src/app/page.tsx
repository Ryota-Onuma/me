import type { Metadata } from 'next';
import { ClientLayout } from './ClientLayout';
import { AboutSection } from '@/components/sections';
import { getUnifiedContent } from '@/lib/content';
import { SITE_DESCRIPTION } from '@/data/site';

export const metadata: Metadata = {
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
};

export default function HomePage() {
  const updates = getUnifiedContent()
    .filter(update => update.href)
    .slice(0, 5)
    .map(update => ({
      id: `${update.type}-${update.id}`,
      title: update.title,
      date: update.updated || update.date,
      href: update.href,
      isExternal: update.isExternal,
    }));

  return (
    <ClientLayout activePath="/">
      <main id="main-content" tabIndex={-1}>
        <AboutSection updates={updates} />
      </main>
    </ClientLayout>
  );
}
