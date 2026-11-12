import { ArrowRight, Check, Minus } from 'lucide-react';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { FOCUS_RING } from '@/lib/focus';

import { Features } from './features';
import { Logo } from './logo';
import { ProductMockup } from './product-mockup';
import { Reveal } from './reveal';

const SIGN_IN = '/login' as Route;

const primaryButton = `inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 ${FOCUS_RING}`;
const ghostButton = `inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-sm font-medium text-slate-900 transition hover:bg-slate-50 ${FOCUS_RING}`;

const STEPS = [
  {
    title: 'The CEO sets up the company',
    body: 'Create the departments and name a manager for each. Accounts are created from the app: there is no public sign-up.',
  },
  {
    title: 'Managers run their department',
    body: 'Each manager creates projects, adds their team, assigns tasks and keeps the completion of every project up to date.',
  },
  {
    title: 'Everyone does the work',
    body: 'Members see their own tasks, clock in and out, and move work forward. Their manager and the CEO follow along.',
  },
];

/** What each role can open. Mirrors the permission table enforced by the API. */
const ACCESS: Array<{ page: string; ceo: boolean; manager: boolean; member: boolean }> = [
  { page: 'Tasks, roadmap, calendar, docs', ceo: true, manager: true, member: true },
  { page: 'Time clock', ceo: true, manager: true, member: true },
  { page: 'Projects and their completion', ceo: true, manager: true, member: false },
  { page: 'Team and productivity', ceo: true, manager: true, member: false },
  { page: 'Executive overview', ceo: true, manager: false, member: false },
  { page: 'Departments and managers', ceo: true, manager: false, member: false },
  { page: 'Company KPIs and billing', ceo: true, manager: false, member: false },
];

function Mark({ allowed, label }: { allowed: boolean; label: string }) {
  return allowed ? (
    <span className="inline-flex text-emerald-600">
      <Check className="size-4" aria-hidden />
      <span className="sr-only">{label}: allowed</span>
    </span>
  ) : (
    <span className="inline-flex text-slate-500">
      <Minus className="size-4" aria-hidden />
      <span className="sr-only">{label}: not allowed</span>
    </span>
  );
}

/**
 * Public landing page.
 *
 * Always light, whatever the app theme, and built from markup only (no images
 * to load). Every claim on it describes something the product really does.
 */
export function Landing() {
  return (
    <div className="relative min-h-svh overflow-x-clip bg-white text-slate-900 antialiased [color-scheme:light]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-slate-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <nav
          aria-label="Main"
          className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-6"
        >
          <Link href={'/welcome' as Route} className={`rounded-md ${FOCUS_RING}`}>
            <Logo />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {[
              ['Features', '#features'],
              ['How it works', '#how'],
              ['Roles', '#roles'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm text-slate-600 transition hover:text-slate-900 ${FOCUS_RING}`}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={SIGN_IN}
              className={`hidden rounded-md px-3 py-1.5 text-sm text-slate-600 transition hover:text-slate-900 sm:block ${FOCUS_RING}`}
            >
              Log in
            </Link>
            <Link
              href={SIGN_IN}
              className={`inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 ${FOCUS_RING}`}
            >
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      <main id="main">
        <section className="relative px-6 pt-20 pb-16 sm:pt-28">
          <div
            aria-hidden
            className="landing-grid pointer-events-none absolute inset-x-0 top-0 h-[34rem]"
          />
          <div
            aria-hidden
            className="landing-glow pointer-events-none absolute top-[-8rem] left-1/2 h-[34rem] w-[64rem] max-w-full -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(99,102,241,0.14),transparent)]"
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div className="text-center lg:text-left">
              <a
                href="#features"
                className={`landing-rise inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 py-1 pr-3 pl-1 text-xs text-indigo-800 transition hover:bg-indigo-100 ${FOCUS_RING}`}
              >
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  New
                </span>
                Time clock is live
                <ArrowRight className="size-3" aria-hidden />
              </a>

              <h1
                className="landing-rise mt-6 text-5xl font-semibold tracking-tight text-balance text-slate-900 sm:text-6xl"
                style={{ '--d': '0.08s' } as React.CSSProperties}
              >
                Run your whole company from one workspace
              </h1>

              <p
                className="landing-rise mx-auto mt-6 max-w-xl text-lg leading-relaxed text-balance text-slate-600 lg:mx-0"
                style={{ '--d': '0.16s' } as React.CSSProperties}
              >
                AXA Admin gives the CEO a clear view of every department, gives managers the tools
                to run their team, and keeps each person focused on their own work.
              </p>

              <div
                className="landing-rise mx-auto mt-9 flex w-full max-w-xs flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row lg:mx-0 lg:justify-start"
                style={{ '--d': '0.24s' } as React.CSSProperties}
              >
                <Link href={SIGN_IN} className={primaryButton}>
                  Get started
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <a href="#features" className={ghostButton}>
                  See how it works
                </a>
              </div>
            </div>

            <div className="landing-rise relative" style={{ '--d': '0.2s' } as React.CSSProperties}>
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-xl shadow-indigo-900/15 ring-1 ring-slate-200">
                <Image
                  src="/landing/hero.jpg"
                  alt="Sunbeams filtering through a misty forest"
                  fill
                  priority
                  sizes="(min-width: 1024px) 520px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div
            className="landing-rise relative mt-20 sm:mt-28"
            style={{ '--d': '0.34s' } as React.CSSProperties}
          >
            <ProductMockup />
          </div>
        </section>

        <Features />

        <section id="how" className="scroll-mt-24 px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <Reveal className="max-w-2xl">
              <p className="text-sm font-medium text-indigo-600">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
                Three roles, one clear chain of responsibility.
              </h2>
            </Reveal>

            <ol className="mt-14 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <Reveal delay={index * 100} className="h-full">
                    <div className="h-full rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
                      <span className="font-mono text-sm text-indigo-600">0{index + 1}</span>
                      <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="roles" className="scroll-mt-24 px-6 pb-24 sm:pb-32">
          <div className="mx-auto max-w-4xl">
            <Reveal className="text-center">
              <p className="text-sm font-medium text-indigo-600">Access, by design</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
                Permissions enforced where it counts.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-balance text-slate-600 sm:text-lg">
                The menu adapts to the role, and the API refuses everything else. Hiding a button is
                never the only protection.
              </p>
            </Reveal>

            <Reveal className="mt-12" delay={80}>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Which pages each role can open</caption>
                  <thead>
                    <tr className="border-b border-slate-200 text-xs tracking-wider text-slate-500 uppercase">
                      <th scope="col" className="px-5 py-3.5 font-medium">
                        Page
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-center font-medium">
                        CEO
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-center font-medium">
                        Manager
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-center font-medium">
                        Member
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ACCESS.map((row) => (
                      <tr key={row.page} className="border-b border-slate-200 last:border-b-0">
                        <th scope="row" className="px-5 py-3.5 font-normal text-slate-700">
                          {row.page}
                        </th>
                        <td className="px-3 py-3.5 text-center">
                          <Mark allowed={row.ceo} label="CEO" />
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <Mark allowed={row.manager} label="Manager" />
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <Mark allowed={row.member} label="Member" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="px-6 pb-24 sm:pb-32">
          <Reveal>
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 px-6 py-16 text-center sm:py-20">
              <div
                aria-hidden
                className="absolute inset-x-0 -top-24 mx-auto h-56 w-2/3 bg-[radial-gradient(closest-side,rgba(99,102,241,0.18),transparent)] blur-2xl"
              />
              <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
                Bring your company into one workspace.
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-base text-balance text-slate-600 sm:text-lg">
                Sign in with the account your CEO or manager created for you.
              </p>
              <div className="relative mt-8 flex justify-center">
                <Link href={SIGN_IN} className={primaryButton}>
                  Sign in
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-600 sm:flex-row">
          <Logo />
          <div className="flex items-center gap-5">
            <a href="#features" className={`rounded transition hover:text-slate-900 ${FOCUS_RING}`}>
              Features
            </a>
            <a href="#roles" className={`rounded transition hover:text-slate-900 ${FOCUS_RING}`}>
              Roles
            </a>
            <Link
              href={SIGN_IN}
              className={`rounded transition hover:text-slate-900 ${FOCUS_RING}`}
            >
              Sign in
            </Link>
          </div>
          <p>© {new Date().getFullYear()} AXA ecosystem. Internal tooling.</p>
        </div>
      </footer>
    </div>
  );
}
