'use client';

import gsap from 'gsap';
import { useCallback, useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

interface MagneticProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Magnetic({ children, className = '', disabled = false }: MagneticProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const enabledRef = useRef(false);
  const quickRef = useRef<{
    outerX: gsap.QuickToFunc;
    outerY: gsap.QuickToFunc;
    innerX: gsap.QuickToFunc;
    innerY: gsap.QuickToFunc;
  } | null>(null);

  const initQuickTo = useCallback(() => {
    if (!enabledRef.current || !outerRef.current || !innerRef.current) {
      quickRef.current = null;
      return;
    }
    gsap.killTweensOf([outerRef.current, innerRef.current]);
    quickRef.current = {
      outerX: gsap.quickTo(outerRef.current, 'x', { duration: 0.4, ease: 'power3.out' }),
      outerY: gsap.quickTo(outerRef.current, 'y', { duration: 0.4, ease: 'power3.out' }),
      innerX: gsap.quickTo(innerRef.current, 'x', { duration: 0.4, ease: 'power3.out' }),
      innerY: gsap.quickTo(innerRef.current, 'y', { duration: 0.4, ease: 'power3.out' }),
    };
  }, []);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    enabledRef.current = fine && !reduced && !disabled;

    initQuickTo();

    return () => {
      quickRef.current = null;
    };
  }, [disabled, initQuickTo]);

  const handleMouseEnter = () => {
    if (!enabledRef.current) return;
    initQuickTo();
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!enabledRef.current || !outerRef.current) return;
    if (!quickRef.current) {
      initQuickTo();
    }
    if (!quickRef.current) return;

    const rect = outerRef.current.getBoundingClientRect();
    const deltaX = event.clientX - (rect.left + rect.width / 2);
    const deltaY = event.clientY - (rect.top + rect.height / 2);

    quickRef.current.outerX(deltaX * 0.35);
    quickRef.current.outerY(deltaY * 0.35);
    quickRef.current.innerX(deltaX * 0.15);
    quickRef.current.innerY(deltaY * 0.15);
  };

  const handleMouseLeave = () => {
    if (!enabledRef.current || !outerRef.current || !innerRef.current) return;
    quickRef.current = null;
    gsap.to([outerRef.current, innerRef.current], {
      x: 0,
      y: 0,
      duration: 0.75,
      ease: 'elastic.out(1, 0.35)',
      overwrite: 'auto',
    });
  };

  return (
    <div
      ref={outerRef}
      data-cursor="-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block will-change-transform ${className}`}
    >
      <div ref={innerRef} className="inline-flex items-center justify-center will-change-transform">
        {children}
      </div>
    </div>
  );
}
