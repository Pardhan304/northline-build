'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/AsyncStates';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: () => adminApi.getDashboard(),
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
        <ErrorState
          title="Unable to load dashboard summary"
          message={error instanceof Error ? error.message : 'Request failed.'}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!data) {
    return <EmptyState title="No dashboard data available" />;
  }

  const metrics = [
    { label: 'Published Projects', value: data.counts.publishedProjects, href: '/admin/projects' },
    { label: 'Draft Projects', value: data.counts.draftProjects, href: '/admin/projects' },
    { label: 'New Enquiries', value: data.counts.newEnquiries, href: '/admin/enquiries' },
    { label: 'Media Assets', value: data.counts.totalMedia, href: '/admin/media' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-graphite/70">
            Overview of published portfolio content and incoming enquiries.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/projects/new"
            className="border border-graphite bg-graphite px-4 py-2 text-xs font-semibold tracking-wider text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
          >
            Add project
          </Link>
          <Link
            href="/admin/enquiries"
            className="border border-border bg-surface px-4 py-2 text-xs font-semibold tracking-wider text-graphite uppercase transition-colors hover:border-graphite"
          >
            View enquiries
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="border border-border bg-surface p-5 transition-colors hover:border-graphite"
          >
            <p className="font-mono text-[11px] tracking-[0.12em] text-olive uppercase">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-medium tabular-nums text-graphite">{metric.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wider uppercase">Recent Enquiries</h2>
            <Link href="/admin/enquiries" className="text-xs text-olive hover:text-accent">
              View all →
            </Link>
          </div>
          {data.recentEnquiries.length === 0 ? (
            <div className="p-6 text-sm text-graphite/70">No enquiries submitted yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentEnquiries.map((enquiry) => (
                <li key={enquiry.id} className="px-5 py-3.5">
                  <Link
                    href={`/admin/enquiries?selected=${enquiry.id}`}
                    className="flex items-center justify-between gap-4 hover:text-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{enquiry.name}</p>
                      <p className="truncate text-xs text-graphite/65">
                        {enquiry.subject || enquiry.email}
                      </p>
                    </div>
                    <StatusBadge status={enquiry.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wider uppercase">
              Recently Updated Projects
            </h2>
            <Link href="/admin/projects" className="text-xs text-olive hover:text-accent">
              View all →
            </Link>
          </div>
          {data.recentProjects.length === 0 ? (
            <div className="p-6 text-sm text-graphite/70">No projects created yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentProjects.map((project) => (
                <li key={project.id} className="px-5 py-3.5">
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="flex items-center justify-between gap-4 hover:text-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{project.title}</p>
                      <p className="truncate font-mono text-xs text-graphite/65">/{project.slug}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
