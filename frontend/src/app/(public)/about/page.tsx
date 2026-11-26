import type { Metadata } from 'next';
import { MaskedTextReveal } from '@/components/motion/MaskedTextReveal';
import { ClosingCta } from '@/components/public/ClosingCta';
import { CmsPageSections } from '@/components/public/CmsPageSections';
import { HomeServices } from '@/components/public/HomeServices';
import { EmptyState, ErrorState } from '@/components/ui/AsyncStates';
import { fetchPublicPage, fetchPublicServices } from '@/services/public-api';
import type { PageDto, ServiceDto } from '@/types/api';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublicPage('about').catch(() => null);
  return {
    title: page?.seoTitle || 'About',
    description:
      page?.seoDescription ||
      'Learn about Northline Build, our working principles, and construction delivery capabilities.',
  };
}

export default async function AboutPage() {
  let page: PageDto | null = null;
  let services: ServiceDto[] = [];
  let loadError = false;

  try {
    [page, services] = await Promise.all([fetchPublicPage('about'), fetchPublicServices()]);
  } catch {
    loadError = true;
  }

  if (loadError) {
    return (
      <>
        <section className="border-b border-[#0E0E0E]/12 bg-white px-6 pt-36 pb-20 text-[#0E0E0E] md:px-14 md:pt-44 md:pb-24">
          <div className="mx-auto max-w-[1440px]">
            <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
              About
            </p>
            <MaskedTextReveal
              as="h1"
              immediate
              text={'Precision in planning.\nAccountability on site.'}
              className="mt-5 max-w-5xl text-[2.75rem] leading-[1.03] font-medium tracking-[-0.035em] text-[#0E0E0E] md:text-[5.5rem]"
            />
          </div>
        </section>
        <section className="px-6 py-16 md:px-14">
          <div className="mx-auto max-w-[1440px]">
            <ErrorState
              title="Unable to load About page"
              message="The CMS backend could not be reached. Please verify the API server is running."
            />
          </div>
        </section>
      </>
    );
  }

  if (page && page.sections.length > 0) {
    return <CmsPageSections sections={page.sections} services={services} />;
  }

  return (
    <>
      <section className="border-b border-[#0E0E0E]/12 bg-white px-6 pt-36 pb-20 text-[#0E0E0E] md:px-14 md:pt-44 md:pb-24">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
            About
          </p>
          <MaskedTextReveal
            as="h1"
            immediate
            text={'Precision in planning.\nAccountability on site.'}
            className="mt-5 max-w-5xl text-[2.75rem] leading-[1.03] font-medium tracking-[-0.035em] text-[#0E0E0E] md:text-[5.5rem]"
          />
        </div>
      </section>

      <section className="px-6 py-20 md:px-14">
        <div className="mx-auto max-w-[1440px]">
          <EmptyState
            title="About page content not yet published"
            description="Add and publish sections for the 'about' page in the Northline admin CMS to display your company story, working principles, and photography."
          />
        </div>
      </section>

      {services.length > 0 ? (
        <HomeServices
          eyebrow="Capabilities"
          heading="Construction & engineering services"
          services={services}
        />
      ) : null}

      <ClosingCta
        eyebrow="Enquiries"
        heading="Planning a build or technical delivery scope?"
        ctaLabel="Contact our team"
        ctaHref="/contact"
      />
    </>
  );
}
