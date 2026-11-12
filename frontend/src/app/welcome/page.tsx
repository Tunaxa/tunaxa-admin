import type { Metadata } from 'next';

import { Landing } from '@/components/landing/landing';

export const metadata: Metadata = {
  title: 'AXA Admin: run your whole company from one workspace',
  description:
    'Departments, projects, tasks, attendance and notifications in one workspace. The CEO sees everything, managers run their department, members focus on their own work.',
  openGraph: {
    title: 'AXA Admin',
    description: 'Run your whole company from one workspace.',
    type: 'website',
  },
};

export default function WelcomePage() {
  return <Landing />;
}
