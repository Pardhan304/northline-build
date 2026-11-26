'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { NorthlineLogo } from '@/components/brand/NorthlineLogo';
import { ErrorState, LoadingSkeleton } from '@/components/ui/AsyncStates';
import { isApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';

const BASE_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/pages', label: 'Pages' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/enquiries', label: 'Enquiries' },
  { href: '/admin/settings', label: 'Settings' },
] as const;

const ADMIN_ONLY_NAV = [
  { href: '/admin/audit-logs', label: 'Audit Logs' },
  { href: '/admin/users', label: 'Users' },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [drawerOpenForPath, setDrawerOpenForPath] = useState<string | null>(null);
  const drawerOpen = drawerOpenForPath === pathname;

  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => adminApi.getMe(),
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (isError && isApiError(error) && error.status === 401) {
      router.replace('/admin/login');
    }
  }, [isError, error, router]);

  const logoutMutation = useMutation({
    mutationFn: () => adminApi.logout(),
    onSettled: () => {
      queryClient.clear();
      router.replace('/admin/login');
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-8">
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  if (isError) {
    if (isApiError(error) && error.status === 401) {
      return (
        <div className="mx-auto max-w-md p-12 text-sm text-graphite/75">
          Redirecting to sign in...
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-xl p-8">
        <ErrorState
          title="Unable to verify admin session"
          message={error instanceof Error ? error.message : 'Server connection failed.'}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = user.role === 'ADMIN' ? [...BASE_NAV, ...ADMIN_ONLY_NAV] : [...BASE_NAV];

  return (
    <div className="flex min-h-screen bg-paper text-graphite">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-border bg-surface lg:flex">
        <div>
          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            <Link
              href="/admin/dashboard"
              aria-label="Northline CMS"
              className="inline-flex items-center text-graphite"
            >
              <NorthlineLogo size="sm" />
            </Link>
            <Link
              href="/"
              target="_blank"
              className="font-mono text-[10px] tracking-wider text-olive uppercase hover:text-accent"
            >
              View site ↗
            </Link>
          </div>

          <nav aria-label="Admin navigation" className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? 'border-accent bg-paper text-graphite'
                          : 'border-transparent text-graphite/75 hover:bg-paper/60 hover:text-graphite'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="border-t border-border p-4 text-xs">
          <p className="font-medium text-graphite">{user.name}</p>
          <p className="mt-0.5 truncate text-graphite/65">{user.email}</p>
          <p className="mt-1 font-mono text-[10px] tracking-wider text-olive uppercase">
            Role: {user.role}
          </p>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpenForPath((prev) => (prev === pathname ? null : pathname))}
              className="border border-border px-3 py-1.5 text-xs font-semibold tracking-wider uppercase lg:hidden"
            >
              {drawerOpen ? 'Close' : 'Menu'}
            </button>
            <span className="font-mono text-xs tracking-[0.12em] text-olive uppercase">
              Administration
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-graphite/75 sm:inline">{user.email}</span>
            <button
              type="button"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              className="border border-border bg-paper px-3.5 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors hover:border-graphite disabled:opacity-50"
            >
              {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </header>

        {drawerOpen ? (
          <nav
            aria-label="Mobile admin navigation"
            className="border-b border-border bg-surface p-4 lg:hidden"
          >
            <ul className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setDrawerOpenForPath(null)}
                      className={`block border px-3 py-2 text-xs font-medium uppercase ${
                        active
                          ? 'border-accent bg-paper text-graphite'
                          : 'border-border text-graphite/75'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
