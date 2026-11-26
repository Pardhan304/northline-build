'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Magnetic } from '@/components/motion/Magnetic';
import { MaskedTextReveal } from '@/components/motion/MaskedTextReveal';
import { EmptyState } from '@/components/ui/AsyncStates';
import type { ServiceDto } from '@/types/api';

const SERVICE_IMAGE_MAP: Record<string, string> = {
  'pre-construction-feasibility': '/images/service-preconstruction.jpg',
  'structural-concrete-timber': '/images/service-structural.jpg',
  'architectural-fit-out': '/images/service-fitout.jpg',
  'facade-envelope-systems': '/images/service-facade.jpg',
};

const CAPABILITY_IMAGES = [
  '/images/service-preconstruction.jpg',
  '/images/service-structural.jpg',
  '/images/service-fitout.jpg',
  '/images/service-facade.jpg',
] as const;

function getCapabilityImage(slug: string, index: number): string {
  return SERVICE_IMAGE_MAP[slug] ?? CAPABILITY_IMAGES[index % CAPABILITY_IMAGES.length]!;
}

interface HomeServicesProps {
  eyebrow?: string;
  heading: string;
  intro?: string;
  services: ServiceDto[];
}

export function HomeServices({ eyebrow, heading, intro, services }: HomeServicesProps) {
  const [activeId, setActiveId] = useState<string | null>(services[0]?.id ?? null);
  const activeService = services.find((s) => s.id === activeId) ?? services[0] ?? null;

  return (
    <section id="capabilities" className="bg-white px-6 py-24 text-[#0E0E0E] md:px-14 md:py-36">
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
              {eyebrow}
            </p>
          ) : null}
          <MaskedTextReveal
            as="h2"
            text={heading}
            className="mt-4 text-[2.25rem] leading-[1.06] font-medium tracking-[-0.03em] text-[#0E0E0E] md:text-[4.25rem]"
          />
          {intro ? (
            <p className="mt-6 max-w-xl text-[1.06rem] leading-[1.55] tracking-[-0.01em] text-[#5C5C5C] md:text-[1.25rem]">
              {intro}
            </p>
          ) : null}
        </div>

        {services.length === 0 ? (
          <div className="mt-14">
            <EmptyState
              title="No published services configured"
              description="Services published in the Northline admin panel will appear here."
            />
          </div>
        ) : (
          <>
            {/* 2x2 Editorial Service Cards */}
            <div className="mt-14 grid gap-x-8 gap-y-12 md:mt-20 md:grid-cols-2">
              {services.map((service, index) => {
                const isActive = activeService?.id === service.id;
                const num = String(index + 1).padStart(2, '0');
                const imageSrc = getCapabilityImage(service.slug, index);

                return (
                  <article key={service.id} className="group">
                    <button
                      type="button"
                      aria-expanded={isActive}
                      onMouseEnter={() => setActiveId(service.id)}
                      onFocus={() => setActiveId(service.id)}
                      onClick={() => setActiveId(service.id)}
                      className="block w-full cursor-pointer text-left"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-[#F5F5F7]">
                        <Image
                          src={imageSrc}
                          alt={service.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105"
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/15"
                        />
                        <div className="relative z-10 flex items-center justify-between p-6 md:p-7">
                          <span className="rounded-full bg-white/90 px-3 py-1 text-[0.75rem] font-medium tracking-[0.08em] text-[#0E0E0E] uppercase tabular-nums backdrop-blur-sm">
                            {num}
                          </span>
                          <span className="rounded-full bg-white/90 px-3 py-1 text-[0.75rem] font-medium text-[#0E0E0E] backdrop-blur-sm">
                            Capability
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 flex items-baseline justify-between gap-4">
                        <h3 className="text-[1.5rem] leading-[1.2] font-medium tracking-[-0.02em] text-[#0E0E0E] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-1.5 md:text-[2rem]">
                          {service.title}
                        </h3>
                      </div>
                      <p className="mt-2 max-w-lg text-[0.94rem] leading-[1.6] text-[#5C5C5C] md:text-[1rem]">
                        {service.summary}
                      </p>
                    </button>
                  </article>
                );
              })}
            </div>

            {/* Interactive Capability Pills + Active Detail Strip */}
            <div className="mt-16 border-t border-[#0E0E0E]/12 pt-12 md:mt-24">
              <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                Our capabilities
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {services.map((service) => {
                  const isActive = activeService?.id === service.id;
                  return (
                    <Magnetic key={service.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(service.id)}
                        onMouseEnter={() => setActiveId(service.id)}
                        onFocus={() => setActiveId(service.id)}
                        className={`group relative cursor-pointer overflow-hidden rounded-full border px-6 py-3 text-[0.94rem] font-medium tracking-[-0.01em] transition-colors ${
                          isActive
                            ? 'border-[#0E0E0E] bg-[#0E0E0E] text-white'
                            : 'border-[#0E0E0E]/15 bg-[#F5F5F7] text-[#0E0E0E]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 translate-y-full rounded-full bg-[#0E0E0E] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0"
                        />
                        <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                          {service.title}
                        </span>
                      </button>
                    </Magnetic>
                  );
                })}
              </div>

              {activeService ? (
                <div className="mt-8 rounded-3xl bg-[#F5F5F7] p-8 md:p-10">
                  <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                    Selected discipline
                  </p>
                  <h3 className="mt-2 text-[1.5rem] leading-[1.2] font-medium tracking-[-0.02em] text-[#0E0E0E] md:text-[2rem]">
                    {activeService.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-[0.94rem] leading-[1.6] text-[#5C5C5C] md:text-[1rem]">
                    {activeService.description || activeService.summary}
                  </p>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
