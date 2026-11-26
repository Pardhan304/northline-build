'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import MouseFollower from 'mouse-follower';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function PublicMotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    let lenis: Lenis | null = null;
    let updateTicker: ((time: number) => void) | null = null;

    if (!reducedMotion) {
      lenis = new Lenis({
        lerp: 0.08,
        smoothWheel: true,
        wheelMultiplier: 1,
      });
      lenisRef.current = lenis;
      lenis.on('scroll', ScrollTrigger.update);

      updateTicker = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(updateTicker);
      gsap.ticker.lagSmoothing(0);
    }

    let cursor: MouseFollower | null = null;
    if (finePointer && !reducedMotion) {
      MouseFollower.registerGSAP(gsap);
      cursor = new MouseFollower({
        speed: 0.55,
        ease: 'expo.out',
        skewing: 2,
        skewingText: 2,
        stateDetection: {
          '-hidden': 'input,textarea,select,[contenteditable="true"],[data-cursor="-hidden"]',
          '-pointer': 'a:not([data-cursor="-hidden"]),button:not([data-cursor="-hidden"])',
        },
      });
    }

    return () => {
      if (updateTicker) {
        gsap.ticker.remove(updateTicker);
      }
      lenis?.destroy();
      lenisRef.current = null;
      cursor?.destroy();
    };
  }, []);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [pathname]);

  return <>{children}</>;
}
