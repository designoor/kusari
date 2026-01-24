'use client';

import dynamic from 'next/dynamic';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';

/**
 * Landing page - handles onboarding flow and redirects.
 *
 * Uses dynamic import with ssr: false to completely disable server-side
 * rendering. This eliminates hydration mismatches since the component
 * only ever renders on the client.
 */
const HomeContent = dynamic(() => import('./HomeContent'), {
  ssr: false,
  loading: () => <AppShellSkeleton />,
});

export default function Home() {
  return <HomeContent />;
}
