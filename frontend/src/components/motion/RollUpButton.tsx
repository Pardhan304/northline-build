'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Magnetic } from '@/components/motion/Magnetic';

interface RollUpBaseProps {
  children: ReactNode;
  className?: string;
  fillClassName?: string;
  hoverTextClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

interface RollUpLinkProps extends RollUpBaseProps {
  href: string;
}

interface RollUpButtonProps extends RollUpBaseProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

function RollUpInner({
  children,
  fillClassName = 'bg-[#0E0E0E]',
  hoverTextClassName = 'text-white',
}: {
  children: ReactNode;
  fillClassName?: string;
  hoverTextClassName?: string;
}) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 translate-y-full rounded-full transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0 ${fillClassName}`}
      />
      <span className="relative z-10 block overflow-hidden">
        <span className="inline-flex items-center gap-2 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-full">
          {children}
        </span>
        <span
          aria-hidden="true"
          className={`absolute inset-0 flex translate-y-full items-center justify-center gap-2 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0 ${hoverTextClassName}`}
        >
          {children}
        </span>
      </span>
    </>
  );
}

export function RollUpLink({
  href,
  children,
  className = 'border border-[#0E0E0E] text-[#0E0E0E]',
  fillClassName = 'bg-[#0E0E0E]',
  hoverTextClassName = 'text-white',
  ariaLabel,
}: RollUpLinkProps) {
  return (
    <Magnetic>
      <Link
        href={href}
        aria-label={ariaLabel}
        data-cursor="-hidden"
        className={`group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-full px-9 py-4 text-[0.94rem] font-medium tracking-[-0.01em] ${className}`}
      >
        <RollUpInner fillClassName={fillClassName} hoverTextClassName={hoverTextClassName}>
          {children}
        </RollUpInner>
      </Link>
    </Magnetic>
  );
}

export function RollUpButton({
  type = 'button',
  disabled = false,
  onClick,
  children,
  className = 'border border-[#0E0E0E] text-[#0E0E0E]',
  fillClassName = 'bg-[#0E0E0E]',
  hoverTextClassName = 'text-white',
  ariaLabel,
}: RollUpButtonProps) {
  return (
    <Magnetic disabled={disabled}>
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
        data-cursor="-hidden"
        className={`group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-full px-9 py-4 text-[0.94rem] font-medium tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <RollUpInner fillClassName={fillClassName} hoverTextClassName={hoverTextClassName}>
          {children}
        </RollUpInner>
      </button>
    </Magnetic>
  );
}
