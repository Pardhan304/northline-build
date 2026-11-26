'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/AsyncStates';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';
import type { PublishStatus, ServiceDto } from '@/types/api';

export default function AdminServicesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ServiceDto | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<PublishStatus>('PUBLISHED');
  const [sortOrder, setSortOrder] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.services.all,
    queryFn: () => adminApi.listServices(),
    staleTime: 60 * 1000,
  });

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setSummary('');
    setDescription('');
    setStatus('PUBLISHED');
    setSortOrder(0);
  };

  const loadForEdit = (service: ServiceDto) => {
    setEditing(service);
    setTitle(service.title);
    setSummary(service.summary);
    setDescription(service.description);
    setStatus(service.status);
    setSortOrder(service.sortOrder);
    setFeedback(null);
    setErrorMsg(null);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateService(editing.id, { title, summary, description, status, sortOrder })
        : adminApi.createService({ title, summary, description, status, sortOrder }),
    onSuccess: async () => {
      setErrorMsg(null);
      setFeedback(editing ? 'Service updated.' : 'Service created.');
      resetForm();
      await queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save service.');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => adminApi.archiveService(id),
    onSuccess: async () => {
      setFeedback('Service archived.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to archive service.');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setErrorMsg(null);
    saveMutation.mutate();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Services & Capabilities</h1>
        <p className="mt-1 text-sm text-graphite/70">
          Manage the construction and engineering capabilities shown on the public website.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="space-y-4 border border-border bg-surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {editing ? `Edit: ${editing.title}` : 'Add Service'}
              </h2>
              {editing ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-olive hover:text-accent"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            {feedback ? (
              <div role="status" className="border border-olive/40 bg-olive/10 p-3 text-xs">
                {feedback}
              </div>
            ) : null}
            {errorMsg ? (
              <div role="alert" className="border border-accent/50 bg-accent/10 p-3 text-xs">
                {errorMsg}
              </div>
            ) : null}

            <div>
              <label className="block font-mono text-xs text-olive uppercase">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-olive uppercase">Summary *</label>
              <textarea
                rows={2}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-olive uppercase">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-olive uppercase">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PublishStatus)}
                  className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-xs text-olive uppercase">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                  className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full border border-graphite bg-graphite px-4 py-2.5 text-xs font-semibold tracking-wider text-surface uppercase hover:border-accent hover:bg-accent disabled:opacity-60"
            >
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Service' : 'Create Service'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7">
          {isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : isError ? (
            <ErrorState
              title="Unable to load services"
              message={error instanceof Error ? error.message : 'Request failed.'}
              onRetry={() => void refetch()}
            />
          ) : !data?.length ? (
            <EmptyState
              title="No services yet"
              description="Create capabilities on the left to display them on the website."
            />
          ) : (
            <div className="divide-y divide-border border border-border bg-surface">
              {data.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-wrap items-start justify-between gap-4 p-5 hover:bg-paper/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-concrete">#{service.sortOrder}</span>
                      <h3 className="text-base font-medium">{service.title}</h3>
                      <StatusBadge status={service.status} />
                    </div>
                    <p className="mt-2 text-sm text-graphite/75">{service.summary}</p>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => loadForEdit(service)}
                      className="text-graphite uppercase hover:text-accent"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={archiveMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Archive "${service.title}"?`)) {
                          archiveMutation.mutate(service.id);
                        }
                      }}
                      className="text-accent uppercase hover:underline"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
