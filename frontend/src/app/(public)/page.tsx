import type { Metadata } from 'next';
import { MaskedTextReveal } from '@/components/motion/MaskedTextReveal';
import { CmsPageSections } from '@/components/public/CmsPageSections';
import { ContactForm } from '@/components/public/ContactForm';
import { HomeHero } from '@/components/public/HomeHero';
import { HomeProjects } from '@/components/public/HomeProjects';
import { HomeServices } from '@/components/public/HomeServices';
import { ErrorState } from '@/components/ui/AsyncStates';
import {
  fetchPublicPage,
  fetchPublicProjects,
  fetchPublicServices,
  fetchPublicSettings,
} from '@/services/public-api';
import type { PageDto, ProjectDto, PublicSettingsDto, ServiceDto } from '@/types/api';

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    fetchPublicPage('home').catch(() => null),
    fetchPublicSettings().catch((): PublicSettingsDto => ({})),
  ]);

  return {
    title:
      page?.seoTitle ||
      settings.seo?.defaultTitle ||
      'Northline Build — Construction, Engineering & Project Delivery',
    description:
      page?.seoDescription ||
      settings.seo?.defaultDescription ||
      'Commercial construction, structural engineering, and architectural project delivery.',
  };
}

export default async function HomePage() {
  let page: PageDto | null = null;
  let projects: ProjectDto[] = [];
  let services: ServiceDto[] = [];
  let loadError = false;

  try {
    const [pageRes, projectsRes, servicesRes] = await Promise.all([
      fetchPublicPage('home'),
      fetchPublicProjects({ featured: true, limit: 4 }),
      fetchPublicServices(),
    ]);
    page = pageRes;
    projects = projectsRes.items;
    services = servicesRes;
  } catch {
    loadError = true;
  }

  if (loadError) {
    return (
      <>
        <HomeHero
          eyebrow="Construction · Engineering · Delivery"
          headline={'Built with purpose.\nDelivered with precision.'}
          supportingText="Integrated construction management and engineering execution."
        />
        <section className="px-6 py-16 md:px-14">
          <div className="mx-auto max-w-[1440px]">
            <ErrorState
              title="CMS content temporarily unavailable"
              message="We could not reach the backend API to load dynamic homepage sections and featured projects."
            />
          </div>
        </section>
      </>
    );
  }

  if (page && page.sections.length > 0) {
    return (
      <>
        <CmsPageSections sections={page.sections} projects={projects} services={services} isHome />
        <section className="bg-white px-6 py-24 text-[#0E0E0E] md:px-14 md:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                Start an enquiry
              </p>
              <MaskedTextReveal
                as="h2"
                text={'Tell us about\nyour project.'}
                className="mt-4 text-[2.25rem] leading-[1.06] font-medium tracking-[-0.03em] text-[#0E0E0E] md:text-[3.75rem]"
              />
              <p className="mt-5 max-w-md text-[0.94rem] leading-[1.6] text-[#5C5C5C] md:text-[1rem]">
                Share your project brief, site location, and programme goals and our delivery team
                will follow up directly.
              </p>
            </div>
            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <HomeHero
        eyebrow="Construction · Engineering · Delivery"
        headline={'Built with purpose.\nDelivered with precision.'}
        supportingText="Publish the Home page in the Northline admin panel to configure custom hero copy, media, and editorial sections."
      />
      <HomeServices
        eyebrow="Capabilities"
        heading="Construction & engineering services"
        services={services}
      />
      <HomeProjects eyebrow="Selected Work" heading="Published projects" projects={projects} />
    </>
  );
}
