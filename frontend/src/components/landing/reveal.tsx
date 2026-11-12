'use client';

import * as React from 'react';

/**
 * Fades its children in the first time they scroll into view.
 *
 * Content stays visible without JavaScript and when the visitor prefers
 * reduced motion: the hidden state is only applied after mount, and only to
 * elements that start below the fold.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Milliseconds to wait once visible, to stagger siblings. */
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;

    if (!element || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    element.classList.add('reveal-hidden');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        window.setTimeout(() => element.classList.remove('reveal-hidden'), delay);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px' },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
