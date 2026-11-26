'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/AsyncStates';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';
import type { MediaDto } from '@/types/api';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function AdminMediaPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<MediaDto | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.media.list({ page, limit: 24, search: debouncedSearch }),
    queryFn: ({ signal }) =>
      adminApi.listMedia({ page, limit: 24, search: debouncedSearch || undefined, signal }),
    staleTime: 60 * 1000,
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error('Select an image file first.');
      return adminApi.uploadMedia(selectedFile, uploadAlt);
    },
    onSuccess: async (created) => {
      setErrorMsg(null);
      setNotice(`Uploaded ${created.originalName}.`);
      setSelectedFile(null);
      setUploadAlt('');
      setSelected(created);
      setEditAlt(created.altText);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.media.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
      ]);
    },
    onError: (err) => {
      setNotice(null);
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed.');
    },
  });

  const updateAltMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error('No media item selected.');
      return adminApi.updateMediaAltText(selected.id, editAlt);
    },
    onSuccess: async (updated) => {
      setErrorMsg(null);
      setNotice('Alt text updated.');
      setSelected(updated);
      await queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update alt text.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMedia(id),
    onSuccess: async () => {
      setErrorMsg(null);
      setNotice('Media asset deleted.');
      setSelected(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.media.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
      ]);
    },
    onError: (err) => {
      setNotice(null);
      setErrorMsg(err instanceof Error ? err.message : 'Unable to delete media.');
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      setErrorMsg('Only JPEG, PNG, and WebP images are supported.');
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMsg('File exceeds the 10 MB maximum upload size.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please choose an image file to upload.');
      return;
    }
    uploadMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Media Library</h1>
          <p className="mt-1 text-sm text-graphite/70">
            Upload, inspect, and reuse optimized WebP images across projects and pages.
          </p>
        </div>

        <div className="flex border border-border bg-surface font-mono text-xs">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 uppercase ${viewMode === 'grid' ? 'bg-graphite text-surface' : ''}`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 uppercase ${viewMode === 'list' ? 'bg-graphite text-surface' : ''}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Upload Form */}
      <form
        onSubmit={handleUploadSubmit}
        className="grid gap-4 border border-border bg-surface p-5 sm:grid-cols-12 sm:items-end"
      >
        <div className="sm:col-span-5">
          <label className="block font-mono text-xs text-olive uppercase">
            Image File (JPEG, PNG, WebP · max 10 MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="mt-2 block w-full text-xs file:mr-3 file:border file:border-border file:bg-paper file:px-3 file:py-1.5 file:text-xs file:font-medium"
          />
        </div>

        <div className="sm:col-span-5">
          <label className="block font-mono text-xs text-olive uppercase">Alt Text</label>
          <input
            type="text"
            value={uploadAlt}
            onChange={(e) => setUploadAlt(e.target.value)}
            placeholder="Describe the construction or architectural subject"
            className="mt-2 w-full border border-border bg-paper px-3 py-2 text-sm focus:border-graphite focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="w-full border border-graphite bg-graphite px-4 py-2.5 text-xs font-semibold tracking-wider text-surface uppercase hover:border-accent hover:bg-accent disabled:opacity-60"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>

      {notice ? (
        <div role="status" className="border border-olive/40 bg-olive/10 p-3.5 text-sm">
          {notice}
        </div>
      ) : null}
      {errorMsg ? (
        <div role="alert" className="border border-accent/50 bg-accent/10 p-3.5 text-sm">
          {errorMsg}
        </div>
      ) : null}

      <div className="border border-border bg-surface p-4">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search media by filename or alt text..."
          className="w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className={selected ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : isError ? (
            <ErrorState
              title="Unable to load media"
              message={error instanceof Error ? error.message : 'Request failed.'}
              onRetry={() => void refetch()}
            />
          ) : !data?.items.length ? (
            <EmptyState
              title="No media assets yet"
              description="Upload an image above to add it to the library."
            />
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.items.map((item) => {
                const thumb = item.variants?.thumbnail?.url ?? item.publicUrl;
                const isSelected = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelected(item);
                      setEditAlt(item.altText);
                    }}
                    className={`border bg-surface text-left transition-colors ${
                      isSelected ? 'border-accent' : 'border-border hover:border-graphite'
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper">
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt={item.altText || item.originalName}
                          fill
                          sizes="220px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-xs font-medium">{item.originalName}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-concrete">
                        {item.width ?? '?'}×{item.height ?? '?'} ·{' '}
                        {Math.round(item.sizeBytes / 1024)} KB
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-border border border-border bg-surface">
              {data.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelected(item);
                    setEditAlt(item.altText);
                  }}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm hover:bg-paper/60"
                >
                  <span className="truncate font-medium">{item.originalName}</span>
                  <span className="font-mono text-xs text-concrete">
                    {item.width ?? '?'}×{item.height ?? '?'} · {Math.round(item.sizeBytes / 1024)}{' '}
                    KB
                  </span>
                </button>
              ))}
            </div>
          )}

          {data && data.meta.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between border border-border bg-surface px-4 py-3 font-mono text-xs">
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

        {selected ? (
          <aside className="space-y-4 border border-border bg-surface p-5 lg:col-span-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase">Asset Details</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-olive hover:text-accent"
              >
                Close
              </button>
            </div>

            {selected.publicUrl ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-paper">
                <Image
                  src={selected.variants?.card?.url ?? selected.publicUrl}
                  alt={selected.altText || selected.originalName}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
            ) : null}

            <dl className="space-y-2 text-xs">
              <div>
                <dt className="font-mono text-concrete uppercase">Filename</dt>
                <dd className="break-all font-medium">{selected.originalName}</dd>
              </div>
              <div>
                <dt className="font-mono text-concrete uppercase">Dimensions</dt>
                <dd className="font-mono">
                  {selected.width ?? '?'} × {selected.height ?? '?'} px
                </dd>
              </div>
              <div>
                <dt className="font-mono text-concrete uppercase">Uploaded</dt>
                <dd className="font-mono">{new Date(selected.createdAt).toLocaleString()}</dd>
              </div>
            </dl>

            <div>
              <label className="block font-mono text-xs text-olive uppercase">Alt Text</label>
              <input
                type="text"
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={updateAltMutation.isPending}
                onClick={() => updateAltMutation.mutate()}
                className="mt-2 w-full border border-graphite bg-graphite px-3 py-2 text-xs font-semibold tracking-wider text-surface uppercase disabled:opacity-60"
              >
                {updateAltMutation.isPending ? 'Saving...' : 'Save Alt Text'}
              </button>
            </div>

            <div className="border-t border-border pt-4">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      'Delete this asset? Deletion is blocked if it is referenced by a project or page.',
                    )
                  ) {
                    deleteMutation.mutate(selected.id);
                  }
                }}
                className="w-full border border-accent/40 px-3 py-2 text-xs font-semibold tracking-wider text-accent uppercase hover:bg-accent hover:text-surface disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Asset'}
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
