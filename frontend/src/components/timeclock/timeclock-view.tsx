'use client';

import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  LogIn,
  LogOut,
  Timer,
  Users,
} from 'lucide-react';
import * as React from 'react';

import { useAccess } from '@/components/providers/access-provider';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

import {
  CLOCK_EVENT,
  fetchMine,
  fetchTeam,
  formatMinutes,
  timeOfDay,
  weekRange,
  type Entry,
  type TeamRow,
} from './timeclock-api';
import { useClock } from './use-clock';

/** A full-time week, the yardstick the bars are drawn against. */
const WEEK_TARGET_MINUTES = 40 * 60;

interface WeekData {
  key: string;
  mine: { entries: Entry[]; totalMinutes: number };
  team: TeamRow[] | null;
}

/**
 * Pointage: your own clock-ins for the week, and, for a manager or the CEO,
 * who is present now and how many hours each person did.
 */
export function TimeclockView() {
  const access = useAccess();
  const [offset, setOffset] = React.useState(0);
  const [version, setVersion] = React.useState(0);
  const [data, setData] = React.useState<WeekData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const canSeeTeam = access.can('timeclock:read');
  const { from, to } = React.useMemo(() => weekRange(offset), [offset]);
  const key = `${offset}:${version}`;

  // Reload whenever somebody clocks in or out, here or from the top bar.
  React.useEffect(() => {
    const bump = () => setVersion((v) => v + 1);

    window.addEventListener(CLOCK_EVENT, bump);

    return () => window.removeEventListener(CLOCK_EVENT, bump);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    Promise.all([fetchMine(from, to), canSeeTeam ? fetchTeam(from, to) : Promise.resolve(null)])
      .then(([mine, team]) => {
        if (cancelled) return;
        setError(null);
        setData({ key, mine, team });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Chargement impossible');
      });

    return () => {
      cancelled = true;
    };
  }, [from, to, key, canSeeTeam]);

  const loading = data === null || data.key !== key;
  const label = `${from.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${new Date(
    to.getTime() - 1,
  ).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;

  const days = React.useMemo(() => {
    const groups = new Map<string, Entry[]>();

    for (const entry of data?.mine.entries ?? []) {
      const day = new Date(entry.clockInAt).toDateString();

      groups.set(day, [...(groups.get(day) ?? []), entry]);
    }

    return Array.from(groups.entries());
  }, [data]);

  const daysPresent = days.length;
  const totalMinutes = data?.mine.totalMinutes ?? 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start gap-3">
        <span className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-xl">
          <Clock className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Pointage</h1>
          <p className="text-muted-foreground text-sm">
            Pointe ton arrivée et ton départ. Les heures sont calculées à partir de l&apos;heure du
            serveur.
          </p>
        </div>
      </header>

      <ClockCard />

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-40 text-center text-sm font-medium tabular-nums">{label}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            disabled={offset === 0}
            aria-label="Semaine suivante"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        {offset !== 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setOffset(0)}>
            Cette semaine
          </Button>
        ) : null}
      </section>

      {error ? (
        <Card>
          <CardContent className="text-destructive pt-5 text-sm">{error}</CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat
          icon={Timer}
          label="Heures"
          value={loading ? null : formatMinutes(totalMinutes)}
          hint={`sur ${WEEK_TARGET_MINUTES / 60} h`}
          progress={totalMinutes / WEEK_TARGET_MINUTES}
        />
        <Stat
          icon={CalendarCheck}
          label="Jours présents"
          value={loading ? null : String(daysPresent)}
          hint="cette semaine"
        />
        <Stat
          icon={Clock}
          label="Moyenne par jour"
          value={
            loading
              ? null
              : daysPresent === 0
                ? '—'
                : formatMinutes(Math.round(totalMinutes / daysPresent))
          }
          hint="jours pointés"
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold tracking-tight">Mes pointages</h2>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="grid gap-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : days.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Clock}
                  title="Aucun pointage cette semaine"
                  description="Utilise le bouton ci-dessus pour pointer ton arrivée."
                />
              </div>
            ) : (
              <ul className="divide-border/60 divide-y">
                {days.map(([day, entries]) => (
                  <li key={day} className="flex flex-col gap-1.5 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium capitalize">
                        {new Date(entries[0]!.clockInAt).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {formatMinutes(entries.reduce((sum, e) => sum + e.minutes, 0))}
                      </span>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {entries.map((entry) => (
                        <li
                          key={entry.id}
                          className="text-muted-foreground flex items-center gap-2 text-xs tabular-nums"
                        >
                          <span>{timeOfDay(entry.clockInAt)}</span>
                          <span aria-hidden>→</span>
                          {entry.clockOutAt ? (
                            <span>{timeOfDay(entry.clockOutAt)}</span>
                          ) : (
                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                              En cours
                            </span>
                          )}
                          <span className="text-foreground ml-auto font-medium">
                            {formatMinutes(entry.minutes)}
                          </span>
                          {entry.note ? (
                            <span className="max-w-48 truncate italic" title={entry.note}>
                              {entry.note}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {canSeeTeam ? (
        <TeamSection rows={loading || !data ? null : data.team} showDepartment={access.isCeo} />
      ) : null}
    </div>
  );
}

/** The big clock-in / clock-out card. */
function ClockCard() {
  const clock = useClock();

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 pt-5">
        <div className="min-w-0 flex-1">
          {!clock.ready ? (
            <Skeleton className="h-10 w-48" />
          ) : clock.clockedIn ? (
            <>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                </span>
                Tu es pointé
                {clock.since ? ` depuis ${timeOfDay(clock.since)}` : ''}
              </div>
              <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">
                {clock.elapsed}
              </div>
            </>
          ) : (
            <>
              <div className="text-muted-foreground text-sm font-medium">
                Tu n&apos;es pas pointé
              </div>
              <div className="text-muted-foreground/70 mt-1 font-mono text-3xl font-semibold tabular-nums">
                00:00:00
              </div>
            </>
          )}
        </div>

        {clock.ready ? (
          <Button
            size="lg"
            onClick={clock.toggle}
            disabled={clock.busy}
            variant={clock.clockedIn ? 'outline' : 'default'}
          >
            {clock.busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : clock.clockedIn ? (
              <LogOut className="size-4" />
            ) : (
              <LogIn className="size-4" />
            )}
            {clock.clockedIn ? 'Pointer le départ' : "Pointer l'arrivée"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  progress,
}: {
  icon: typeof Clock;
  label: string;
  value: string | null;
  hint: string;
  progress?: number;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-5">
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
          <Icon className="size-3.5" aria-hidden />
          {label}
        </span>
        {value === null ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
        )}
        {progress !== undefined ? (
          <div className="bg-muted/60 h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-[width] duration-500"
              style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
            />
          </div>
        ) : null}
        <span className="text-muted-foreground text-[11px]">{hint}</span>
      </CardContent>
    </Card>
  );
}

function TeamSection({
  rows,
  showDepartment,
}: {
  rows: TeamRow[] | null;
  showDepartment: boolean;
}) {
  const sorted = React.useMemo(
    () =>
      [...(rows ?? [])].sort(
        (a, b) =>
          Number(Boolean(b.presentSince)) - Number(Boolean(a.presentSince)) ||
          b.minutes - a.minutes,
      ),
    [rows],
  );
  const present = sorted.filter((row) => row.presentSince).length;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        <Users className="text-muted-foreground mt-0.5 size-4" aria-hidden />
        <div>
          <h2 className="text-base font-semibold tracking-tight">Équipe</h2>
          <p className="text-muted-foreground text-xs">
            {rows ? `${present} présent(s) sur ${rows.length}` : 'Chargement…'}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {rows === null ? (
            <div className="grid gap-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={Users} title="Personne dans l'équipe" />
            </div>
          ) : (
            <ul className="divide-border/60 divide-y">
              {sorted.map((row) => (
                <li key={row.userId} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={row.name} seed={row.userId} size="md" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-sm font-medium">{row.name}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      {showDepartment && row.department ? `${row.department.name} · ` : ''}
                      {row.presentSince ? (
                        <span className="text-emerald-700 dark:text-emerald-300">
                          Présent depuis {timeOfDay(row.presentSince)}
                        </span>
                      ) : (
                        'Absent'
                      )}
                    </div>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <div className="bg-muted/60 h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full"
                        style={{
                          width: `${Math.min(100, Math.round((row.minutes / WEEK_TARGET_MINUTES) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right text-xs tabular-nums">
                    <div className="font-medium">{formatMinutes(row.minutes)}</div>
                    <div className="text-muted-foreground">{row.daysPresent} j</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
