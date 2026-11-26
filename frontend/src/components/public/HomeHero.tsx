'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { RollUpLink } from '@/components/motion/RollUpButton';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface HomeHeroProps {
  eyebrow?: string;
  headline: string;
  supportingText: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  videoUrl?: string | null;
  posterUrl?: string | null;
}

export function HomeHero({
  eyebrow,
  headline,
  supportingText,
  primaryCtaLabel = 'Get in touch',
  primaryCtaHref = '/contact',
  secondaryCtaLabel,
  secondaryCtaHref,
  videoUrl,
  posterUrl,
}: HomeHeroProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const bannerWrapRef = useRef<HTMLDivElement | null>(null);
  const bannerMediaRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 767px)');

    const sync = () => {
      setReducedMotion(motionQuery.matches);
      setIsMobileViewport(mobileQuery.matches);
    };
    sync();
    motionQuery.addEventListener('change', sync);
    mobileQuery.addEventListener('change', sync);

    return () => {
      motionQuery.removeEventListener('change', sync);
      mobileQuery.removeEventListener('change', sync);
    };
  }, []);

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) return;

      const tl = gsap.timeline();

      tl.fromTo(
        '.hero-reveal-line',
        { yPercent: 115, rotateZ: 1.5 },
        {
          yPercent: 0,
          rotateZ: 0,
          duration: 1,
          stagger: 0.1,
          ease: 'power4.out',
          clearProps: 'transform',
        },
      )
        .fromTo(
          '.hero-sub-row',
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power4.out',
            clearProps: 'transform,opacity',
          },
          '-=0.6',
        )
        .fromTo(
          '.hero-cta-row',
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: 'power4.out',
            clearProps: 'transform,opacity',
          },
          '-=0.6',
        );

      if (bannerWrapRef.current && bannerMediaRef.current) {
        gsap.fromTo(
          bannerMediaRef.current,
          { scale: 1.06, yPercent: 0 },
          {
            scale: 1,
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: bannerWrapRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      }
    },
    { scope: sectionRef },
  );

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleVisibility = () => {
      if (document.hidden) {
        videoEl.pause();
      } else if (!reducedMotion && !videoFailed) {
        void videoEl.play().catch(() => { });
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries[0]?.isIntersecting ?? true;
        if (!inView) {
          videoEl.pause();
        } else if (!document.hidden && !reducedMotion && !videoFailed) {
          void videoEl.play().catch(() => { });
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(videoEl);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [reducedMotion, videoFailed]);

  const shouldRenderVideo =
    Boolean(videoUrl) && !reducedMotion && !videoFailed && !isMobileViewport;
  const lines = headline.split('\n').filter((line) => line.length > 0);

  return (
    <section
      ref={sectionRef}
      data-cursor="-inverse"
      aria-label="Hero"
      className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden bg-black px-6 pt-28 pb-24 text-white md:min-h-screen md:px-14 md:pt-32 md:pb-28"
    >
      {/* Dark monochrome architectural backdrop */}
      <div
        ref={bannerWrapRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div ref={bannerMediaRef} className="relative h-full w-full will-change-transform">
          <Image
            src={posterUrl || '/images/hero-dark-bw.jpg'}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-75 grayscale contrast-115"
          />

          {shouldRenderVideo && videoUrl ? (
            <video
              ref={videoRef}
              className={`absolute inset-0 h-full w-full object-cover opacity-50 grayscale transition-opacity duration-700 ${videoReady ? 'opacity-50' : 'opacity-0'
                }`}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={posterUrl ?? '/images/hero-dark-bw.jpg'}
              onCanPlay={() => setVideoReady(true)}
              onError={() => setVideoFailed(true)}
            >
              <source src={videoUrl} />
            </video>
          ) : null}

          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 62% 54% at 50% 42%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 65%, rgba(0,0,0,0.52) 100%)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/70" />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1040px] flex-col items-center text-center">
        {eyebrow ? (
          <p className="hero-sub-row mb-5 text-[0.75rem] font-medium tracking-[0.14em] text-white/75 uppercase">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="max-w-4xl text-[2.75rem] leading-[1.03] font-medium tracking-[-0.03em] text-white md:text-[5.25rem]">
          {lines.map((line, index) => (
            <span
              key={`${index}-${line.slice(0, 12)}`}
              className="block overflow-hidden pb-[0.06em]"
            >
              <span className="hero-reveal-line block origin-top-left">{line}</span>
            </span>
          ))}
        </h1>

        {supportingText ? (
          <p className="hero-sub-row mt-7 max-w-2xl text-[1.06rem] leading-[1.48] font-normal tracking-[-0.01em] text-white/90 md:mt-8 md:text-[1.28rem]">
            {supportingText}
          </p>
        ) : null}

        {(primaryCtaLabel && primaryCtaHref) || (secondaryCtaLabel && secondaryCtaHref) ? (
          <div className="hero-cta-row mt-10 flex flex-wrap items-center justify-center gap-4 md:mt-11">
            {primaryCtaLabel && primaryCtaHref ? (
              <RollUpLink
                href={primaryCtaHref}
                className="border border-white bg-white px-8 py-4 text-[#0E0E0E]"
                fillClassName="bg-[#E6E6EB]"
                hoverTextClassName="text-[#0E0E0E]"
              >
                {primaryCtaLabel}
              </RollUpLink>
            ) : null}
            {secondaryCtaLabel && secondaryCtaHref ? (
              <RollUpLink
                href={secondaryCtaHref}
                className="border border-white/35 bg-transparent px-8 py-4 text-white"
                fillClassName="bg-white"
                hoverTextClassName="text-[#0E0E0E]"
              >
                {secondaryCtaLabel}
              </RollUpLink>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
