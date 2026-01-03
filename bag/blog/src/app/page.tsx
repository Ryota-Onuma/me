import { ClientLayout } from './ClientLayout';
import { AboutSection } from '@/components/sections';

export default function HomePage() {
  return (
    <ClientLayout>
      <main>
        <AboutSection />
      </main>
    </ClientLayout>
  );
}
