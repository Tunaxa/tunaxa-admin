'use client';

import * as React from 'react';

import { useToast } from '@/components/providers/toast-provider';

import {
  CLOCK_EVENT,
  clockIn,
  clockOut,
  fetchStatus,
  formatClock,
  formatMinutes,
  type Entry,
} from './timeclock-api';

/**
 * The caller's clock: whether they are clocked in, and a live elapsed timer.
 *
 * The timer is measured against the server's clock (offset taken from the
 * status call), so a computer with the wrong time still shows the right
 * duration.
 */
export function useClock() {
  const toast = useToast();
  const [open, setOpen] = React.useState<Entry | null | undefined>(undefined);
  const [offsetMs, setOffsetMs] = React.useState(0);
  // The server's idea of "now", advanced every second while clocked in.
  const [nowMs, setNowMs] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(() => {
    void fetchStatus()
      .then((status) => {
        setOpen(status.open);
        setOffsetMs(new Date(status.now).getTime() - Date.now());
        setNowMs(new Date(status.now).getTime());
      })
      .catch(() => setOpen((previous) => (previous === undefined ? null : previous)));
  }, []);

  React.useEffect(() => {
    refresh();
    window.addEventListener(CLOCK_EVENT, refresh);

    return () => window.removeEventListener(CLOCK_EVENT, refresh);
  }, [refresh]);

  // One timer per mounted widget, running only while somebody is clocked in.
  React.useEffect(() => {
    if (!open) return;

    const id = window.setInterval(() => setNowMs(Date.now() + offsetMs), 1000);

    return () => window.clearInterval(id);
  }, [open, offsetMs]);

  const elapsedSeconds = open && nowMs ? (nowMs - new Date(open.clockInAt).getTime()) / 1000 : 0;

  async function toggle() {
    setBusy(true);

    try {
      if (open) {
        const closed = await clockOut();

        toast.success('Départ pointé', `Session de ${formatMinutes(closed.minutes)}.`);
      } else {
        await clockIn();
        toast.success('Arrivée pointée', 'Bonne journée !');
      }
    } catch (err) {
      toast.error('Pointage impossible', err instanceof Error ? err.message : 'Réessaie.');
      refresh();
    } finally {
      setBusy(false);
    }
  }

  return {
    ready: open !== undefined,
    clockedIn: Boolean(open),
    since: open?.clockInAt ?? null,
    elapsed: formatClock(elapsedSeconds),
    busy,
    toggle,
  };
}
