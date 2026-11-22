import { apiFetch } from '@/lib/api';

export interface Entry {
  id: string;
  clockInAt: string;
  clockOutAt: string | null;
  open: boolean;
  minutes: number;
  note: string | null;
}

export interface TeamRow {
  userId: string;
  name: string;
  email: string;
  role: string;
  department: { id: string; name: string } | null;
  presentSince: string | null;
  minutes: number;
  daysPresent: number;
}

/** Fired after a clock-in or clock-out so every widget on screen can refresh. */
export const CLOCK_EVENT = 'timeclock:changed';

export function fetchStatus(): Promise<{ open: Entry | null; now: string }> {
  return apiFetch('/timeclock/status');
}

export async function clockIn(): Promise<Entry> {
  const entry = await apiFetch<Entry>('/timeclock/clock-in', { method: 'POST' });

  window.dispatchEvent(new Event(CLOCK_EVENT));

  return entry;
}

export async function clockOut(note?: string): Promise<Entry> {
  const entry = await apiFetch<Entry>('/timeclock/clock-out', {
    method: 'POST',
    body: JSON.stringify({ note }),
  });

  window.dispatchEvent(new Event(CLOCK_EVENT));

  return entry;
}

function range(from: Date, to: Date): string {
  return `from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
}

export function fetchMine(
  from: Date,
  to: Date,
): Promise<{ entries: Entry[]; totalMinutes: number }> {
  return apiFetch(`/timeclock/me?${range(from, to)}`);
}

export function fetchTeam(from: Date, to: Date): Promise<TeamRow[]> {
  return apiFetch(`/timeclock/team?${range(from, to)}`);
}

/** Monday 00:00 (local) to the next Monday, `offset` weeks away from this one. */
export function weekRange(offset = 0): { from: Date; to: Date } {
  const start = new Date();

  start.setHours(0, 0, 0, 0);
  // getDay(): Sunday is 0, so shift to make Monday the first day.
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);

  const end = new Date(start);

  end.setDate(end.getDate() + 7);

  return { from: start, to: end };
}

/** 452 -> "7 h 32"; under an hour -> "32 min". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) return `${m} min`;

  return `${h} h ${String(m).padStart(2, '0')}`;
}

/** 3725 seconds -> "01:02:05". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export const timeOfDay = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
