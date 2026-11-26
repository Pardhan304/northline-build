import type { ReactNode } from 'react';
import 'mouse-follower/dist/mouse-follower.min.css';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { PublicMotionProvider } from '@/components/public/PublicMotionProvider';
import { fetchPublicServices, fetchPublicSettings } from '@/services/public-api';
import type { PublicSettingsDto } from '@/types/api';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [settings, services] = await Promise.all([
    fetchPublicSettings().catch((): PublicSettingsDto => ({})),
    fetchPublicServices().catch(() => []),
  ]);

  return (
    <PublicMotionProvider>
      <div className="relative flex min-h-screen flex-col bg-white text-[#0E0E0E]">
        <SiteHeader
          companyName={settings.general?.companyName}
          contact={settings.contact}
          social={settings.social}
          services={services}
        />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter settings={settings} />
      </div>
    </PublicMotionProvider>
  );
}
