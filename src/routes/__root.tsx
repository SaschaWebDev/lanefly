import { Suspense } from 'react';
import {
  createRootRoute,
  Outlet,
} from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/app/query-client';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/hooks/use-theme';
import { Spinner } from '@/components/ui/spinner';

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <Suspense
            fallback={
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
            }
          >
            <Outlet />
          </Suspense>
        </ToastProvider>
      </ThemeProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
