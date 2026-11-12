import { Bell, Boxes, Clock, Lock, ShieldCheck, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import { Reveal } from './reveal';

interface Feature {
  title: string;
  body: string;
  /** Tailwind column span on the 6-column grid at `lg`. */
  span: string;
  icon: typeof Clock;
  visual: ReactNode;
}

const card =
  'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 hover:border-slate-200 hover:bg-slate-100';

function Visual({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="mt-6 flex min-h-32 flex-1 items-end justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      {children}
    </div>
  );
}

const FEATURES: Feature[] = [
  {
    title: 'Departments, run by their own managers',
    body: 'The CEO creates a department and names its manager in one step. The manager then creates projects, sets their progress and builds the team.',
    span: 'lg:col-span-4',
    icon: Boxes,
    visual: (
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <span className="rounded-full border border-[#5e6ad2]/40 bg-[#5e6ad2]/15 px-3 py-1 text-[11px] font-medium text-indigo-700">
          CEO
        </span>
        <span className="h-4 w-px bg-slate-100" />
        <div className="grid w-full grid-cols-3 gap-2">
          {['Engineering', 'Marketing', 'Support'].map((name) => (
            <div
              key={name}
              className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-center"
            >
              <p className="text-[11px] font-medium text-slate-700">{name}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Manager + team</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'The right pages for the right role',
    body: 'Every role sees its own menu. A forbidden page is blocked, not merely hidden.',
    span: 'lg:col-span-2',
    icon: ShieldCheck,
    visual: (
      <div className="flex w-full flex-col gap-2">
        {[
          ['CEO', 'Everything'],
          ['Manager', 'Own department'],
          ['Member', 'Own tasks'],
        ].map(([role, scope]) => (
          <div
            key={role}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
          >
            <span className="font-medium text-slate-700">{role}</span>
            <span className="text-slate-500">{scope}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Data stays inside its department',
    body: 'A manager cannot read another department’s tasks, projects or people. The API answers “not found”, so it does not even confirm they exist.',
    span: 'lg:col-span-2',
    icon: Lock,
    visual: (
      <div className="grid w-full grid-cols-3 gap-2">
        {[0, 1, 2].map((lane) => (
          <div
            key={lane}
            className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2"
          >
            {[0, 1, 2].map((row) => (
              <span
                key={row}
                className={`h-2 rounded-full ${lane === 0 ? 'bg-indigo-500/70' : 'bg-slate-100'}`}
                style={{ width: `${90 - row * 18}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'A time clock that cannot be gamed',
    body: 'Clock in and out from the top bar. Times come from the server, and the database allows only one open session per person, even when clicks race.',
    span: 'lg:col-span-2',
    icon: Clock,
    visual: (
      <div className="flex flex-col items-center gap-2">
        <span className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-700">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          Clocked in
        </span>
        <span className="font-mono text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
          08:12:45
        </span>
      </div>
    ),
  },
  {
    title: 'Progress you can read at a glance',
    body: 'Red when not done, amber when under way, green when finished. Executives see every department and project without opening a single task.',
    span: 'lg:col-span-2',
    icon: Trophy,
    visual: (
      <div className="flex w-full flex-col gap-2">
        {[
          ['bg-emerald-400', 'Design the sign-in screen'],
          ['bg-amber-400', 'Migrate authentication'],
          ['bg-rose-500', 'Write the launch page'],
        ].map(([tone, label]) => (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700"
          >
            <span className={`size-2 rounded-full ${tone}`} />
            {label}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Told when it matters',
    body: 'Members hear about new assignments, managers hear when their people move work forward. No inbox to check.',
    span: 'lg:col-span-2',
    icon: Bell,
    visual: (
      <div className="flex w-full flex-col gap-2">
        {['New task assigned to you', 'Sam moved “JWT migration” to review'].map((text, index) => (
          <div
            key={text}
            className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700"
            style={{ marginLeft: index * 14 }}
          >
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#6366f1]" />
            {text}
          </div>
        ))}
      </div>
    ),
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-indigo-600">
            Built for how a company is organised
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
            Everything a company needs, scoped to who is looking.
          </h2>
          <p className="mt-4 text-base text-balance text-slate-600 sm:text-lg">
            Departments, projects, tasks, attendance and notifications share one data model, so
            every view is always consistent.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-6">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} className={feature.span} delay={(index % 3) * 90}>
              <article className={card}>
                <span className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-slate-100 text-indigo-700">
                  <feature.icon className="size-4.5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.body}</p>
                <Visual>{feature.visual}</Visual>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
