'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/AsyncStates';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';
import type { MediaDto } from '@/types/api';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaDto) => void;
  title?: string;
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  title = 'Select Media Asset',
}: MediaPickerModalProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.media.list({ page, limit: 12, search: debouncedSearch }),
    queryFn: ({ signal }) =>
      adminApi.listMedia({ page, limit: 12, search: debouncedSearch, signal }),
    enabled: open,
    staleTime: 60 * 1000,
  });

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 p-4"
    >
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col border border-border bg-surface text-graphite">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-3 py-1 text-xs font-medium uppercase hover:border-graphite"
          >
            Close
          </button>
        </div>

        <div className="border-b border-border px-6 py-3">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search uploaded images by filename or alt text..."
            className="w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : isError ? (
            <ErrorState
              title="Failed to load media library"
              message={error instanceof Error ? error.message : 'Request failed.'}
              onRetry={() => void refetch()}
            />
          ) : !data?.items.length ? (
            <EmptyState
              title="No media assets found"
              description="Upload images in the Media Library first, then select them here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.items.map((item) => {
                const thumbUrl = item.variants?.thumbnail?.url ?? item.publicUrl;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="group border border-border bg-paper text-left transition-colors hover:border-accent"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
                      {thumbUrl ? (
                        <Image
                          src={thumbUrl}
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
                        {item.width ?? '?'}×{item.height ?? '?'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {data && data.meta.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border px-6 py-3 font-mono text-xs">
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
    </div>
  );
}
