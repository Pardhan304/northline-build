'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/AsyncStates';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';
import type { AdminEnquiryDto, EnquiryStatus } from '@/types/api';

const STATUS_OPTIONS: EnquiryStatus[] = ['NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED'];

export default function AdminEnquiriesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | ''>('');
  const [selected, setSelected] = useState<AdminEnquiryDto | null>(null);
  const [nextStatus, setNextStatus] = useState<EnquiryStatus>('NEW');
  const [adminNotes, setAdminNotes] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.enquiries.list({
      page,
      limit: 20,
      status: statusFilter || undefined,
      search: debouncedSearch,
    }),
    queryFn: ({ signal }) =>
      adminApi.listEnquiries({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
        signal,
      }),
    staleTime: 30 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error('No enquiry selected.');
      return adminApi.updateEnquiry(selected.id, {
        status: nextStatus,
        adminNotes: adminNotes.trim() || null,
      });
    },
    onSuccess: async (updated) => {
      setErrorMsg(null);
      setNotice('Enquiry updated.');
      setSelected(updated);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
      ]);
    },
    onError: (err) => {
      setNotice(null);
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update enquiry.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error('No enquiry selected.');
      return adminApi.deleteEnquiry(selected.id);
    },
    onSuccess: async () => {
      setErrorMsg(null);
      setNotice(null);
      setSelected(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
      ]);
    },
    onError: (err) => {
      setNotice(null);
      setErrorMsg(err instanceof Error ? err.message : 'Unable to delete enquiry.');
    },
  });

  const openEnquiry = (enquiry: AdminEnquiryDto) => {
    setSelected(enquiry);
    setNextStatus(enquiry.status);
    setAdminNotes(enquiry.adminNotes ?? '');
    setNotice(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Enquiry Inbox</h1>
        <p className="mt-1 text-sm text-graphite/70">
          Review incoming contact submissions, update status, and record private internal notes.
        </p>
      </div>

      <div className="flex flex-col gap-3 border border-border bg-surface p-4 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, email, or subject..."
          className="flex-1 border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as EnquiryStatus | '');
            setPage(1);
          }}
          className="border border-border bg-paper px-3.5 py-2 text-sm sm:w-48"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className={selected ? 'lg:col-span-7' : 'lg:col-span-12'}>
          {isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : isError ? (
            <ErrorState
              title="Unable to load enquiries"
              message={error instanceof Error ? error.message : 'Request failed.'}
              onRetry={() => void refetch()}
            />
          ) : !data?.items.length ? (
            <EmptyState
              title="No enquiries found"
              description="Submissions from the public Contact page will appear here."
            />
          ) : (
            <div className="overflow-x-auto border border-border bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-paper/60 font-mono text-[11px] tracking-wider text-olive uppercase">
                  <tr>
                    <th className="px-4 py-3">Sender</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => openEnquiry(item)}
                      className={`cursor-pointer hover:bg-paper/60 ${
                        selected?.id === item.id ? 'bg-paper' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-graphite/65">{item.email}</p>
                      </td>
                      <td className="px-4 py-3 text-graphite/80">
                        {item.subject || 'General enquiry'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-graphite/70">
                        {new Date(item.createdAt).toLocaleDateString()}
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

        {selected ? (
          <aside className="space-y-5 border border-border bg-surface p-6 lg:col-span-5">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-medium">{selected.name}</h2>
                <p className="text-xs text-graphite/70">
                  {selected.email}
                  {selected.phone ? ` · ${selected.phone}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-olive hover:text-accent"
              >
                Close
              </button>
            </div>

            {notice ? (
              <div role="status" className="border border-olive/40 bg-olive/10 p-3 text-xs">
                {notice}
              </div>
            ) : null}
            {errorMsg ? (
              <div role="alert" className="border border-accent/50 bg-accent/10 p-3 text-xs">
                {errorMsg}
              </div>
            ) : null}

            <div>
              <p className="font-mono text-[11px] text-concrete uppercase">Subject</p>
              <p className="mt-1 text-sm font-medium">{selected.subject || 'General enquiry'}</p>
            </div>

            {selected.company ||
            selected.projectType ||
            selected.projectLocation ||
            selected.projectArea ||
            selected.expectedStart ? (
              <dl className="grid grid-cols-2 gap-3 border-y border-border py-3 text-xs">
                {selected.company ? (
                  <div>
                    <dt className="font-mono text-[10px] text-concrete uppercase">Company</dt>
                    <dd className="mt-0.5 font-medium">{selected.company}</dd>
                  </div>
                ) : null}
                {selected.projectType ? (
                  <div>
                    <dt className="font-mono text-[10px] text-concrete uppercase">Project Type</dt>
                    <dd className="mt-0.5 font-medium">{selected.projectType}</dd>
                  </div>
                ) : null}
                {selected.projectLocation ? (
                  <div>
                    <dt className="font-mono text-[10px] text-concrete uppercase">Location</dt>
                    <dd className="mt-0.5 font-medium">{selected.projectLocation}</dd>
                  </div>
                ) : null}
                {selected.projectArea ? (
                  <div>
                    <dt className="font-mono text-[10px] text-concrete uppercase">Area</dt>
                    <dd className="mt-0.5 font-medium">{selected.projectArea}</dd>
                  </div>
                ) : null}
                {selected.expectedStart ? (
                  <div>
                    <dt className="font-mono text-[10px] text-concrete uppercase">
                      Expected Start
                    </dt>
                    <dd className="mt-0.5 font-medium">{selected.expectedStart}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            <div>
              <p className="font-mono text-[11px] text-concrete uppercase">Message</p>
              <p className="mt-1 whitespace-pre-wrap border border-border bg-paper p-3.5 text-sm leading-relaxed">
                {selected.message}
              </p>
            </div>

            <div>
              <label className="block font-mono text-xs text-olive uppercase">Status</label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as EnquiryStatus)}
                className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs text-olive uppercase">
                Private Admin Notes (never shown publicly)
              </label>
              <textarea
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
                className="flex-1 border border-graphite bg-graphite px-4 py-2.5 text-xs font-semibold tracking-wider text-surface uppercase hover:border-accent hover:bg-accent disabled:opacity-60"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Enquiry Update'}
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm('Delete this enquiry permanently?')) {
                    deleteMutation.mutate();
                  }
                }}
                className="border border-accent/40 px-4 py-2.5 text-xs font-semibold tracking-wider text-accent uppercase hover:bg-accent hover:text-surface disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
