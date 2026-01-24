'use client';

import dynamic from 'next/dynamic';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component that protects routes requiring authentication.
 *
 * Uses dynamic import with ssr: false to completely disable server-side
 * rendering. This eliminates hydration mismatches since the component
 * only ever renders on the client.
 */
const AuthGuardContent = dynamic(() => import('./AuthGuardContent'), {
  ssr: false,
  loading: () => <AppShellSkeleton />,
});

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  return <AuthGuardContent>{children}</AuthGuardContent>;
};
