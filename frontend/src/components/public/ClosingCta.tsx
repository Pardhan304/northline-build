import Image from 'next/image';
import { MaskedTextReveal } from '@/components/motion/MaskedTextReveal';
import { RollUpLink } from '@/components/motion/RollUpButton';

interface ClosingCtaProps {
  eyebrow?: string;
  heading: string;
  body?: string;
  ctaLabel: string;
  ctaHref: string;
  backgroundUrl?: string | null;
}

export function ClosingCta({
  eyebrow,
  heading,
  body,
  ctaLabel,
  ctaHref,
  backgroundUrl,
}: ClosingCtaProps) {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-24 text-[#0E0E0E] md:px-14 md:py-32">
      {backgroundUrl ? (
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-3xl bg-[#0E0E0E] px-8 py-20 text-white md:px-16 md:py-28">
          <div className="relative z-10 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              {eyebrow ? (
                <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                  {eyebrow}
                </p>
              ) : null}
              <MaskedTextReveal
                as="h2"
                text={heading}
                className="mt-4 max-w-3xl text-[2.25rem] leading-[1.06] font-medium tracking-[-0.03em] text-white md:text-[4.25rem]"
              />
              {body ? (
                <p className="mt-5 max-w-xl text-[1.06rem] leading-[1.55] text-[#9A9A9A] md:text-[1.25rem]">
                  {body}
                </p>
              ) : null}
            </div>
            <div className="lg:col-span-4 lg:flex lg:justify-end">
              <RollUpLink
                href={ctaHref}
                className="border border-white/30 bg-[#0E0E0E] text-white"
                fillClassName="bg-white"
                hoverTextClassName="text-[#0E0E0E]"
              >
                {ctaLabel}
              </RollUpLink>
            </div>
          </div>
          <Image
            src={backgroundUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
          />
        </div>
      ) : (
        <div className="mx-auto max-w-[1440px] rounded-3xl bg-[#F5F5F7] px-8 py-16 md:px-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              {eyebrow ? (
                <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#9A9A9A] uppercase">
                  {eyebrow}
                </p>
              ) : null}
              <MaskedTextReveal
                as="h2"
                text={heading}
                className="mt-4 max-w-3xl text-[2.25rem] leading-[1.06] font-medium tracking-[-0.03em] text-[#0E0E0E] md:text-[4.25rem]"
              />
              {body ? (
                <p className="mt-5 max-w-xl text-[1.06rem] leading-[1.55] text-[#5C5C5C] md:text-[1.25rem]">
                  {body}
                </p>
              ) : null}
            </div>
            <div className="lg:col-span-4 lg:flex lg:justify-end">
              <RollUpLink
                href={ctaHref}
                className="border border-[#0E0E0E] bg-white text-[#0E0E0E]"
                fillClassName="bg-[#0E0E0E]"
                hoverTextClassName="text-white"
              >
                {ctaLabel}
              </RollUpLink>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
