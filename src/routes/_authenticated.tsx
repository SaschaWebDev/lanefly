import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@/config/supabase';
import { isDemoMode } from '@/config/demo';
import { Spinner } from '@/components/ui/spinner';
import { AppLayout } from '@/components/layout/app-layout';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    if (isDemoMode) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
  },
  pendingComponent: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Spinner size="lg" />
    </div>
  ),
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
