import type { SVGProps } from 'react';

interface NorthlineMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/** Architectural hollow-line 'N' roofline monogram matching the Northline Build brand mark. */
export function NorthlineMark({ size = 36, className = '', ...props }: NorthlineMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      {...props}
    >
      {/* Roofline eave rafter */}
      <path
        d="M7 25.5L39 9.5L56 19.5V23.8L39 13.8L12.5 27V29.5L7 26.8V25.5Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="miter"
      />
      {/* Architectural double-channel N frame + structural base footings */}
      <path
        d="M12.5 27V49.5H8.5V53.5H25V49.5H21.2V34.2L40.5 53.5H55V49.5H50.5V20.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d="M17.2 24.5V49.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
      <path
        d="M21.2 22.6L43.2 45.2V16.4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d="M46.8 18.4V49.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
    </svg>
  );
}

interface NorthlineLogoProps {
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { icon: 26, title: 'text-[0.95rem]', sub: 'text-[0.86rem]', gap: 'gap-2' },
  md: { icon: 34, title: 'text-[1.125rem]', sub: 'text-[1.02rem]', gap: 'gap-2.5' },
  lg: { icon: 42, title: 'text-[1.35rem]', sub: 'text-[1.2rem]', gap: 'gap-3' },
} as const;

/** Stacked `northline / build` lockup matching the provided brand specification. */
export function NorthlineLogo({
  compact = false,
  size = 'md',
  className = '',
}: NorthlineLogoProps) {
  const s = SIZE_MAP[size];

  if (compact) {
    return (
      <span className={`inline-flex items-center ${s.gap} ${className}`}>
        <NorthlineMark size={s.icon} />
        <span className={`${s.title} leading-none font-semibold tracking-[-0.03em]`}>
          northline
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <NorthlineMark size={s.icon} />
      <span className="flex flex-col leading-[0.95] tracking-[-0.03em]">
        <span className={`${s.title} font-semibold`}>northline</span>
        <span className={`${s.sub} font-normal opacity-90`}>build</span>
      </span>
    </span>
  );
}
