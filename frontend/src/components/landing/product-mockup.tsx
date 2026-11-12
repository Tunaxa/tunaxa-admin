import { Clock, Crown, FolderKanban, LayoutDashboard, Trophy, Users } from 'lucide-react';

/**
 * A faithful miniature of the Executive overview, drawn in markup rather than
 * pasted as a screenshot so it stays sharp at any size and weighs nothing.
 *
 * Purely decorative: the figures are illustrative, which is why it is hidden
 * from assistive technology and given a plain-language label for the rest.
 */
export function ProductMockup() {
  const departments = [
    { name: 'Engineering', manager: 'Karim B.', value: 72, tasks: '14 / 21' },
    { name: 'Marketing', manager: 'Nadia A.', value: 48, tasks: '6 / 13' },
    { name: 'Support', manager: 'Youssef I.', value: 91, tasks: '20 / 22' },
  ];

  const tasks = [
    {
      title: 'Migrate authentication to JWT',
      who: 'Sam',
      tone: 'bg-amber-400',
      status: 'In progress',
    },
    { title: 'Launch landing page', who: 'Omar', tone: 'bg-rose-500', status: 'Todo' },
    { title: 'Design the sign-in screen', who: 'Lina', tone: 'bg-emerald-400', status: 'Done' },
    { title: 'Help-center articles', who: 'Zakaria', tone: 'bg-emerald-400', status: 'Done' },
  ];

  const nav = [
    { label: 'Work', icon: LayoutDashboard, active: false },
    { label: 'Time clock', icon: Clock, active: false },
    { label: 'Executive', icon: Crown, active: true },
    { label: 'Productivity', icon: Trophy, active: false },
    { label: 'Projects', icon: FolderKanban, active: false },
    { label: 'Team', icon: Users, active: false },
  ];

  return (
    <div
      role="img"
      aria-label="Preview of the Executive overview: departments with progress bars and a task table with status lights"
      className="relative mx-auto w-full max-w-5xl"
    >
      <div
        aria-hidden
        className="absolute -inset-x-4 sm:-inset-x-10 -top-10 -bottom-10 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(99,102,241,0.18),transparent_70%)] blur-2xl"
      />

      <div
        aria-hidden
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_40px_100px_-30px_rgba(49,46,129,0.35)]"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <span className="size-2.5 rounded-full bg-slate-100" />
          <span className="size-2.5 rounded-full bg-slate-100" />
          <span className="size-2.5 rounded-full bg-slate-100" />
          <span className="ml-3 truncate rounded-md bg-slate-100 px-3 py-1 font-mono text-[11px] text-slate-500">
            app.axa-admin.com/executive
          </span>
        </div>

        <div className="grid grid-cols-[148px_1fr] text-left sm:grid-cols-[180px_1fr]">
          <div className="hidden flex-col gap-1 border-r border-slate-200 bg-slate-50 p-3 sm:flex">
            <div className="mb-3 flex items-center gap-2 px-2">
              <span className="grid size-6 place-items-center rounded-md bg-indigo-600 text-[11px] font-bold text-slate-900">
                A
              </span>
              <span className="text-xs font-semibold text-slate-700">AXA Admin</span>
            </div>
            {nav.map((item) => (
              <span
                key={item.label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                  item.active ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-600'
                }`}
              >
                <item.icon className={`size-3.5 ${item.active ? 'text-indigo-600' : ''}`} />
                {item.label}
              </span>
            ))}
          </div>

          <div className="col-span-2 flex flex-col gap-4 p-4 sm:col-span-1 sm:p-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Executive overview</p>
              <p className="text-[11px] text-slate-500">Where every department stands this week.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {departments.map((d) => (
                <div key={d.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{d.name}</p>
                      <p className="text-[10px] text-slate-500">{d.manager}</p>
                    </div>
                    <span className="text-sm font-semibold text-indigo-600 tabular-nums">
                      {d.value}%
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                      style={{ width: `${d.value}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500 tabular-nums">
                    {d.tasks} tasks done
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] tracking-wider text-slate-500 uppercase">
                <span>Task</span>
                <span className="hidden sm:block">Assignee</span>
                <span>Status</span>
              </div>
              {tasks.map((t) => (
                <div
                  key={t.title}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-slate-200 px-3 py-2 text-xs last:border-b-0"
                >
                  <span className="truncate text-slate-700">{t.title}</span>
                  <span className="hidden text-slate-500 sm:block">{t.who}</span>
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className={`size-2 rounded-full ${t.tone}`} />
                    <span className="hidden w-16 sm:block">{t.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent"
      />
    </div>
  );
}
