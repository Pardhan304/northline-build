'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { MaskedTextReveal } from '@/components/motion/MaskedTextReveal';

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  eyebrow?: string;
  heading: string;
  items: FaqItem[];
}

export function FaqAccordion({ eyebrow, heading, items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <section className="bg-white px-6 py-24 text-[#0E0E0E] md:px-14 md:py-36">
      <div className="mx-auto grid max-w-[1440px] gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
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
        </div>

        <div className="divide-y divide-[#0E0E0E]/12 border-y border-[#0E0E0E]/12 md:col-span-7">
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-6">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full cursor-pointer items-center justify-between gap-6 text-left"
                >
                  <span className="text-[1.25rem] leading-[1.3] font-medium tracking-[-0.02em] text-[#0E0E0E] md:text-[1.5rem]">
                    {item.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#0E0E0E]/15 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                      isOpen ? 'rotate-45 bg-[#0E0E0E] text-white' : 'bg-white text-[#0E0E0E]'
                    }`}
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                </button>

                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pt-4 pr-12 text-[0.94rem] leading-[1.6] text-[#5C5C5C] md:text-[1rem]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
