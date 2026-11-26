'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/AsyncStates';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';

export default function AdminPagesListPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.pages.all,
    queryFn: () => adminApi.listPages(),
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Pages & Sections</h1>
        <p className="mt-1 text-sm text-graphite/70">
          Edit structured sections, visibility, ordering, and SEO metadata for public pages.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError ? (
        <ErrorState
          title="Unable to load CMS pages"
          message={error instanceof Error ? error.message : 'Request failed.'}
          onRetry={() => void refetch()}
        />
      ) : !data?.length ? (
        <EmptyState
          title="No CMS pages seeded"
          description="Run the backend database seed script to create default Home, About, and Contact pages."
        />
      ) : (
        <div className="divide-y divide-border border border-border bg-surface">
          {data.map((page) => (
            <div
              key={page.id}
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 hover:bg-paper/60"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-medium">{page.title}</h2>
                  <StatusBadge status={page.status} />
                </div>
                <p className="mt-1 font-mono text-xs text-graphite/65">
                  /{page.slug === 'home' ? '' : page.slug} · {page.sections.length} sections
                </p>
              </div>

              <Link
                href={`/admin/pages/${page.slug}`}
                className="border border-graphite bg-graphite px-4 py-2 text-xs font-semibold tracking-wider text-surface uppercase hover:border-accent hover:bg-accent"
              >
                Edit sections
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
