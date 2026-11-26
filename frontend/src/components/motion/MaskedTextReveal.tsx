'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface MaskedTextRevealProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  delayMs?: number;
  immediate?: boolean;
}

export function MaskedTextReveal({
  text,
  as: Tag = 'h2',
  className = '',
  delayMs = 0,
  immediate = false,
}: MaskedTextRevealProps) {
  const containerRef = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || !containerRef.current) return;

      const lineEls = containerRef.current.querySelectorAll('.reveal-line');
      if (lineEls.length === 0) return;

      const baseTo: gsap.TweenVars = {
        yPercent: 0,
        rotateZ: 0,
        duration: 1,
        delay: delayMs / 1000,
        stagger: 0.08,
        ease: 'power4.out',
        clearProps: 'transform',
      };

      if (immediate) {
        gsap.fromTo(lineEls, { yPercent: 115, rotateZ: 1.5 }, baseTo);
        return;
      }

      gsap.fromTo(
        lineEls,
        { yPercent: 115, rotateZ: 1.5 },
        {
          ...baseTo,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 86%',
            once: true,
          },
        },
      );
    },
    { scope: containerRef, dependencies: [immediate, delayMs, text] },
  );

  const lines = text.split('\n').filter((line) => line.length > 0);

  return (
    <Tag ref={containerRef} className={className}>
      {lines.map((line, index) => (
        <span key={`${index}-${line.slice(0, 12)}`} className="block overflow-hidden pb-[0.06em]">
          <span className="reveal-line block origin-top-left">{line}</span>
        </span>
      ))}
    </Tag>
  );
}
