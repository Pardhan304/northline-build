'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { MaskedTextReveal } from '@/components/motion/MaskedTextReveal';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ImageTextItem {
  label: string;
  detail: string;
}

interface EditorialSplitProps {
  id?: string;
  eyebrow?: string;
  heading: string;
  body: string;
  imageUrl?: string | null;
  imageAlt?: string;
  items?: ImageTextItem[];
}

export function EditorialSplit({
  id,
  eyebrow,
  heading,
  body,
  imageUrl,
  imageAlt = '',
  items,
}: EditorialSplitProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || !sectionRef.current) return;

      const hairlines = sectionRef.current.querySelectorAll('.animated-hairline');
      hairlines.forEach((line) => {
        gsap.fromTo(
          line,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.9,
            ease: 'power4.out',
            transformOrigin: 'left center',
            scrollTrigger: {
              trigger: line,
              start: 'top 88%',
              once: true,
            },
          },
        );
      });

      if (items && items.length > 0) {
        const stages = gsap.utils.toArray<HTMLElement>(
          sectionRef.current.querySelectorAll('.process-stage'),
        );
        stages.forEach((stage, idx) => {
          ScrollTrigger.create({
            trigger: stage,
            start: 'top 58%',
            end: 'bottom 42%',
            onToggle: (self) => {
              if (self.isActive && window.scrollY > 10) {
                setActiveIndex(idx);
              }
            },
          });
        });
      }
    },
    { scope: sectionRef, dependencies: [items] },
  );

  const hasStages = Boolean(items && items.length > 0);
  const totalLabel = hasStages && items ? String(items.length).padStart(2, '0') : '00';
  const currentLabel = String(activeIndex + 1).padStart(2, '0');

  return (
    <section
      id={id}
      ref={sectionRef}
      className="border-b border-[#0E0E0E]/12 bg-white px-6 py-24 text-[#0E0E0E] md:px-14 md:py-36"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <div
            className={
              hasStages ? 'md:sticky md:top-32 md:col-span-5 md:self-start' : 'md:col-span-5'
            }
          >
            {eyebrow ? (
              <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                {eyebrow}
              </p>
            ) : null}

            <MaskedTextReveal
              as="h2"
              text={heading}
              className="mt-4 text-[2.25rem] leading-[1.06] font-medium tracking-[-0.03em] text-[#0E0E0E] md:text-[3.5rem]"
            />

            {hasStages ? (
              <p className="mt-10 text-[2.75rem] leading-none font-medium tracking-[-0.03em] text-[#0E0E0E] tabular-nums md:text-[4rem]">
                {currentLabel} <span className="text-[#9A9A9A]">/ {totalLabel}</span>
              </p>
            ) : null}
          </div>

          <div className="md:col-span-7">
            <div className="max-w-2xl space-y-5 text-[1.06rem] leading-[1.55] tracking-[-0.01em] text-[#5C5C5C] md:text-[1.25rem]">
              {body
                .split('\n')
                .filter((p) => p.trim().length > 0)
                .map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
            </div>

            {items && items.length > 0 ? (
              <div className="mt-12 space-y-8">
                {items.map((item, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <div
                      key={`${item.label}-${index}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`process-stage pt-8 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                        isActive ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-45'
                      }`}
                    >
                      <div className="animated-hairline mb-6 h-[1px] w-full bg-[#0E0E0E]/12" />
                      <h3 className="text-[1.5rem] leading-[1.2] font-medium tracking-[-0.02em] text-[#0E0E0E] md:text-[2rem]">
                        {item.label}
                      </h3>
                      <p className="mt-3 max-w-xl text-[0.94rem] leading-[1.6] text-[#5C5C5C] md:text-[1rem]">
                        {item.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {imageUrl ? (
              <div className="relative mt-12 aspect-[16/10] w-full overflow-hidden rounded-3xl bg-[#F5F5F7]">
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
