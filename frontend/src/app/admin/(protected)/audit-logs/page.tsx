'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  AccessDeniedState,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from '@/components/ui/AsyncStates';
import { isApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.auditLogs.list({ page, limit: 25, entityType: entityType || undefined }),
    queryFn: () => adminApi.listAuditLogs({ page, limit: 25, entityType: entityType || undefined }),
    staleTime: 30 * 1000,
  });

  if (isError && isApiError(error) && error.status === 403) {
    return <AccessDeniedState message="Only administrators can inspect audit history." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Audit Logs</h1>
          <p className="mt-1 text-sm text-graphite/70">
            Immutable history of authentication, publishing, media, and settings mutations.
          </p>
        </div>

        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          className="border border-border bg-surface px-3.5 py-2 text-sm"
        >
          <option value="">All entities</option>
          <option value="Project">Project</option>
          <option value="Page">Page</option>
          <option value="Service">Service</option>
          <option value="Media">Media</option>
          <option value="Enquiry">Enquiry</option>
          <option value="SiteSetting">SiteSetting</option>
          <option value="User">User</option>
          <option value="Session">Session</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : isError ? (
        <ErrorState
          title="Unable to load audit logs"
          message={error instanceof Error ? error.message : 'Request failed.'}
          onRetry={() => void refetch()}
        />
      ) : !data?.items.length ? (
        <EmptyState title="No audit events recorded" />
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-paper/60 font-mono text-[11px] tracking-wider text-olive uppercase">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((log) => (
                <tr key={log.id} className="hover:bg-paper/40">
                  <td className="px-4 py-3 font-mono text-xs text-graphite/70">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-accent">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-medium">{log.entityType}</span>
                    <span className="ml-2 font-mono text-concrete">{log.entityId.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {log.actor ? log.actor.email : 'System / CLI'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-graphite/70">
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.meta.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 font-mono text-xs">
              <span>
                Page {data.meta.page} of {data.meta.totalPages}
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
