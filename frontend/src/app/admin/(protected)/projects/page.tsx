'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/AsyncStates';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';
import type { PublishStatus } from '@/types/api';

export default function AdminProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PublishStatus | ''>('');
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.projects.list({
      page,
      limit: 10,
      search: debouncedSearch,
      status: status || undefined,
    }),
    queryFn: ({ signal }) =>
      adminApi.listProjects({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        status: status || undefined,
        signal,
      }),
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-graphite/70">
            Manage draft and published construction case studies.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="border border-graphite bg-graphite px-4 py-2.5 text-xs font-semibold tracking-wider text-surface uppercase hover:border-accent hover:bg-accent"
        >
          Add project
        </Link>
      </div>

      <div className="flex flex-col gap-3 border border-border bg-surface p-4 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search title, slug, or location..."
          className="flex-1 border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as PublishStatus | '');
            setPage(1);
          }}
          className="border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none sm:w-48"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : isError ? (
        <ErrorState
          title="Unable to load projects"
          message={error instanceof Error ? error.message : 'Request failed.'}
          onRetry={() => void refetch()}
        />
      ) : !data?.items.length ? (
        <EmptyState
          title="No projects found"
          description="Create your first project draft to begin building your portfolio."
          action={
            <Link
              href="/admin/projects/new"
              className="inline-flex border border-graphite bg-graphite px-4 py-2 text-xs font-semibold tracking-wider text-surface uppercase"
            >
              Create project
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-paper/60 font-mono text-[11px] tracking-wider text-olive uppercase">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((project) => (
                <tr key={project.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/projects/${project.id}`} className="hover:text-accent">
                      {project.title}
                    </Link>
                    <p className="font-mono text-xs text-graphite/60">/{project.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-graphite/80">{project.category}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {project.isFeatured ? 'Yes' : 'No'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-graphite/70">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="font-mono text-xs font-medium text-accent uppercase hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.meta.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 font-mono text-xs">
              <span>
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="border border-border px-3 py-1 uppercase disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="border border-border px-3 py-1 uppercase disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
