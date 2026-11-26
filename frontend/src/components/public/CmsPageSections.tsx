import { ClosingCta } from '@/components/public/ClosingCta';
import { EditorialSplit } from '@/components/public/EditorialSplit';
import { FaqAccordion } from '@/components/public/FaqAccordion';
import { HomeHero } from '@/components/public/HomeHero';
import { HomeProjects } from '@/components/public/HomeProjects';
import { HomeServices } from '@/components/public/HomeServices';
import { MaskedTextReveal } from '@/components/motion/MaskedTextReveal';
import type { PageSectionDto, ProjectDto, ServiceDto } from '@/types/api';

interface CmsPageSectionsProps {
  sections: PageSectionDto[];
  projects?: ProjectDto[];
  services?: ServiceDto[];
  isHome?: boolean;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export function CmsPageSections({
  sections,
  projects = [],
  services = [],
  isHome = false,
}: CmsPageSectionsProps) {
  return (
    <>
      {sections
        .filter((section) => section.isVisible)
        .map((section) => {
          const c = section.content;

          switch (section.type) {
            case 'HERO': {
              const headline = asString(c.headline);
              if (!headline) return null;
              if (isHome) {
                return (
                  <HomeHero
                    key={section.id}
                    eyebrow={asString(c.eyebrow)}
                    headline={headline}
                    supportingText={asString(c.supportingText) ?? ''}
                    primaryCtaLabel={asString(c.primaryCtaLabel)}
                    primaryCtaHref={asString(c.primaryCtaHref)}
                    secondaryCtaLabel={asString(c.secondaryCtaLabel)}
                    secondaryCtaHref={asString(c.secondaryCtaHref)}
                    videoUrl={asNullableString(c.videoUrl)}
                    posterUrl={asNullableString(c.posterUrl)}
                  />
                );
              }
              return (
                <section
                  key={section.id}
                  className="border-b border-[#0E0E0E]/12 bg-white px-6 pt-36 pb-20 text-[#0E0E0E] md:px-14 md:pt-44 md:pb-24"
                >
                  <div className="mx-auto max-w-[1440px]">
                    {asString(c.eyebrow) ? (
                      <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                        {asString(c.eyebrow)}
                      </p>
                    ) : null}
                    <MaskedTextReveal
                      as="h1"
                      immediate
                      text={headline}
                      className="mt-5 max-w-5xl text-[2.75rem] leading-[1.03] font-medium tracking-[-0.035em] text-[#0E0E0E] md:text-[5.5rem]"
                    />
                    {asString(c.supportingText) ? (
                      <p className="mt-8 max-w-xl text-[1.06rem] leading-[1.55] tracking-[-0.01em] text-[#5C5C5C] md:text-[1.25rem]">
                        {asString(c.supportingText)}
                      </p>
                    ) : null}
                  </div>
                </section>
              );
            }

            case 'RICH_TEXT':
            case 'IMAGE_TEXT': {
              const heading = asString(c.heading);
              const body = asString(c.body);
              if (!heading || !body) return null;
              const rawItems = Array.isArray(c.items) ? c.items : [];
              const items = rawItems
                .filter(
                  (item): item is { label: string; detail: string } =>
                    Boolean(item) &&
                    typeof item === 'object' &&
                    typeof (item as { label?: unknown }).label === 'string' &&
                    typeof (item as { detail?: unknown }).detail === 'string',
                )
                .map((item) => ({ label: item.label, detail: item.detail }));

              if (section.sectionKey === 'faq' && items.length > 0) {
                return (
                  <FaqAccordion
                    key={section.id}
                    eyebrow={asString(c.eyebrow)}
                    heading={heading}
                    items={items.map((item) => ({ question: item.label, answer: item.detail }))}
                  />
                );
              }

              return (
                <EditorialSplit
                  key={section.id}
                  id={section.sectionKey === 'intro' ? 'page-intro' : undefined}
                  eyebrow={asString(c.eyebrow)}
                  heading={heading}
                  body={body}
                  imageUrl={asNullableString(c.imageUrl)}
                  imageAlt={asString(c.imageAlt) ?? ''}
                  items={items.length > 0 ? items : undefined}
                />
              );
            }

            case 'PROJECT_GRID': {
              const heading = asString(c.heading);
              if (!heading) return null;
              const maxItems = typeof c.maxItems === 'number' ? c.maxItems : 4;
              return (
                <HomeProjects
                  key={section.id}
                  eyebrow={asString(c.eyebrow)}
                  heading={heading}
                  intro={asString(c.intro)}
                  projects={projects.slice(0, maxItems)}
                />
              );
            }

            case 'SERVICES_GRID': {
              const heading = asString(c.heading);
              if (!heading) return null;
              return (
                <HomeServices
                  key={section.id}
                  eyebrow={asString(c.eyebrow)}
                  heading={heading}
                  intro={asString(c.intro)}
                  services={services}
                />
              );
            }

            case 'STATISTICS': {
              const rawItems = Array.isArray(c.items) ? c.items : [];
              const items = rawItems.filter(
                (item): item is { label: string; value: string; note?: string } =>
                  Boolean(item) &&
                  typeof item === 'object' &&
                  typeof (item as { label?: unknown }).label === 'string' &&
                  typeof (item as { value?: unknown }).value === 'string',
              );
              if (items.length === 0) return null;
              return (
                <section
                  key={section.id}
                  className="border-b border-[#0E0E0E]/12 bg-white px-6 py-20 md:px-14 md:py-28"
                >
                  <div className="mx-auto max-w-[1440px]">
                    {asString(c.heading) ? (
                      <h2 className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                        {asString(c.heading)}
                      </h2>
                    ) : null}
                    <dl className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                      {items.map((stat, idx) => (
                        <div key={idx} className="border-t border-[#0E0E0E]/12 pt-6">
                          <dd className="text-[2.75rem] leading-none font-medium tracking-[-0.03em] text-[#0E0E0E] tabular-nums md:text-[4rem]">
                            {stat.value}
                          </dd>
                          <dt className="mt-3 text-[0.94rem] font-medium text-[#5C5C5C]">
                            {stat.label}
                          </dt>
                          {stat.note ? (
                            <p className="mt-1 text-xs text-[#9A9A9A]">{stat.note}</p>
                          ) : null}
                        </div>
                      ))}
                    </dl>
                  </div>
                </section>
              );
            }

            case 'CTA': {
              const heading = asString(c.heading);
              const ctaLabel = asString(c.ctaLabel);
              const ctaHref = asString(c.ctaHref);
              if (!heading || !ctaLabel || !ctaHref) return null;
              return (
                <ClosingCta
                  key={section.id}
                  eyebrow={asString(c.eyebrow)}
                  heading={heading}
                  body={asString(c.body)}
                  ctaLabel={ctaLabel}
                  ctaHref={ctaHref}
                  backgroundUrl={asNullableString(c.backgroundUrl)}
                />
              );
            }

            case 'GALLERY':
            default:
              return null;
          }
        })}
    </>
  );
}
