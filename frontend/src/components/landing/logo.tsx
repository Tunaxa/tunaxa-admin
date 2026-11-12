import { useId } from 'react';

/**
 * AXA Admin mark: a rounded tile holding an "A" built from two strokes and a
 * crossbar, with an accent dot at the apex. Drawn as SVG so it stays crisp at
 * any size.
 */
export function LogoMark({ className = 'size-8' }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient
          id={`${id}-bg`}
          x1="4"
          y1="2"
          x2="36"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#3730a3" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${id}-bg)`} />
      <rect width="40" height="40" rx="11" fill="none" stroke="#fff" strokeOpacity=".18" />
      <path
        d="M11.5 29 20 11l8.5 18M15.2 23.5h9.6"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="11" r="2.4" fill="#a5b4fc" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-slate-900">
        AXA <span className="font-medium text-slate-500">Admin</span>
      </span>
    </span>
  );
}
