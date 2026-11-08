'use client';

import { Loader2, LogIn, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useClock } from '@/components/timeclock/use-clock';

/**
 * Clock in / clock out, always one click away in the top bar.
 *
 * While clocked in it becomes a green pill with a running timer; clicking it
 * clocks out. Everybody with a membership has it, whatever their role.
 */
export function ClockButton() {
  const clock = useClock();

  if (!clock.ready) {
    return <div className="bg-muted/60 h-8 w-28 animate-pulse rounded-lg" aria-hidden />;
  }

  return clock.clockedIn ? (
    <Button
      variant="outline"
      size="sm"
      onClick={clock.toggle}
      disabled={clock.busy}
      aria-label="Pointer le départ"
      title="Pointer le départ"
      className="gap-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
    >
      {clock.busy ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
      )}
      <span className="font-mono text-xs tabular-nums">{clock.elapsed}</span>
      <LogOut className="size-3.5 opacity-70" aria-hidden />
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      onClick={clock.toggle}
      disabled={clock.busy}
      aria-label="Pointer l'arrivée"
      className="gap-1.5"
    >
      {clock.busy ? <Loader2 className="size-3.5 animate-spin" /> : <LogIn className="size-3.5" />}
      <span className="hidden lg:inline">Pointer l&apos;arrivée</span>
    </Button>
  );
}
