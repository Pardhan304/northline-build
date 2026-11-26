'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';
import { ErrorState, LoadingSkeleton } from '@/components/ui/AsyncStates';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';
import type { MediaDto, PageDto, PageSectionDto, PublishStatus } from '@/types/api';

function PageEditorInner({ page }: { page: PageDto }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(page.title);
  const [status, setStatus] = useState<PublishStatus>(page.status);
  const [seoTitle, setSeoTitle] = useState(page.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(page.seoDescription ?? '');
  const [sections, setSections] = useState<PageSectionDto[]>(page.sections);
  const [mediaTarget, setMediaTarget] = useState<{
    index: number;
    field: 'posterUrl' | 'imageUrl' | 'backgroundUrl';
    idField?: 'posterMediaId' | 'mediaId' | 'backgroundMediaId';
  } | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updatePage(page.slug, {
        title,
        status,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        sections: sections.map((sec, idx) => ({
          sectionKey: sec.sectionKey,
          type: sec.type,
          content: sec.content,
          sortOrder: idx,
          isVisible: sec.isVisible,
        })),
      }),
    onSuccess: async () => {
      setErrorNotice(null);
      setSavedNotice('Page changes saved.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pages.detail(page.slug) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pages.all }),
      ]);
    },
    onError: (err) => {
      setSavedNotice(null);
      setErrorNotice(err instanceof Error ? err.message : 'Unable to save page.');
    },
  });

  const updateSectionField = (index: number, key: string, value: unknown) => {
    setSections((prev) =>
      prev.map((sec, i) =>
        i === index ? { ...sec, content: { ...sec.content, [key]: value } } : sec,
      ),
    );
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      const current = next[index];
      const swap = next[target];
      if (!current || !swap) return prev;
      next[index] = swap;
      next[target] = current;
      return next;
    });
  };

  const handleMediaSelect = (media: MediaDto) => {
    if (!mediaTarget) return;
    const url = media.variants?.hero?.url ?? media.publicUrl ?? '';
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== mediaTarget.index) return sec;
        const nextContent = { ...sec.content, [mediaTarget.field]: url };
        if (mediaTarget.idField) {
          nextContent[mediaTarget.idField] = media.id;
        }
        return { ...sec, content: nextContent };
      }),
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSavedNotice(null);
    setErrorNotice(null);
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <Link href="/admin/pages" className="font-mono text-xs text-olive hover:text-accent">
            ← All pages
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-medium tracking-tight">Edit Page: {page.title}</h1>
            <StatusBadge status={status} />
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="border border-graphite bg-graphite px-5 py-2.5 text-xs font-semibold tracking-wider text-surface uppercase hover:border-accent hover:bg-accent disabled:opacity-60"
        >
          {mutation.isPending ? 'Saving...' : 'Save Page'}
        </button>
      </div>

      {savedNotice ? (
        <div role="status" className="border border-olive/40 bg-olive/10 p-3.5 text-sm">
          {savedNotice}
        </div>
      ) : null}

      {errorNotice ? (
        <div role="alert" className="border border-accent/50 bg-accent/10 p-3.5 text-sm">
          {errorNotice}
        </div>
      ) : null}

      {/* Page Metadata */}
      <div className="grid gap-5 border border-border bg-surface p-6 sm:grid-cols-2">
        <div>
          <label className="block font-mono text-xs tracking-wider text-olive uppercase">
            Page Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-mono text-xs tracking-wider text-olive uppercase">
            Publish Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PublishStatus)}
            className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div>
          <label className="block font-mono text-xs tracking-wider text-olive uppercase">
            SEO Title
          </label>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-mono text-xs tracking-wider text-olive uppercase">
            SEO Description
          </label>
          <input
            type="text"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5">
        <h2 className="text-base font-semibold">Page Sections</h2>
        {sections.map((sec, index) => {
          const c = sec.content;
          const str = (k: string) => (typeof c[k] === 'string' ? (c[k] as string) : '');

          return (
            <div key={sec.id} className="border border-border bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <span className="font-mono text-xs font-medium tracking-wider text-accent uppercase">
                    {sec.type}
                  </span>
                  <span className="ml-3 font-mono text-xs text-graphite/60">#{sec.sectionKey}</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={sec.isVisible}
                      onChange={(e) =>
                        setSections((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, isVisible: e.target.checked } : item,
                          ),
                        )
                      }
                      className="h-4 w-4 accent-accent"
                    />
                    Visible
                  </label>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveSection(index, -1)}
                    className="border border-border px-2.5 py-1 text-xs uppercase disabled:opacity-40"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    disabled={index === sections.length - 1}
                    onClick={() => moveSection(index, 1)}
                    className="border border-border px-2.5 py-1 text-xs uppercase disabled:opacity-40"
                  >
                    Down
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {sec.type === 'HERO' ? (
                  <>
                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs text-olive uppercase">
                        Eyebrow
                      </label>
                      <input
                        type="text"
                        value={str('eyebrow')}
                        onChange={(e) => updateSectionField(index, 'eyebrow', e.target.value)}
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs text-olive uppercase">
                        Headline (use newline for controlled line breaks)
                      </label>
                      <textarea
                        rows={2}
                        value={str('headline')}
                        onChange={(e) => updateSectionField(index, 'headline', e.target.value)}
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs text-olive uppercase">
                        Supporting Text
                      </label>
                      <textarea
                        rows={2}
                        value={str('supportingText')}
                        onChange={(e) =>
                          updateSectionField(index, 'supportingText', e.target.value)
                        }
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        Primary CTA Label
                      </label>
                      <input
                        type="text"
                        value={str('primaryCtaLabel')}
                        onChange={(e) =>
                          updateSectionField(index, 'primaryCtaLabel', e.target.value)
                        }
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        Primary CTA Link
                      </label>
                      <input
                        type="text"
                        value={str('primaryCtaHref')}
                        onChange={(e) =>
                          updateSectionField(index, 'primaryCtaHref', e.target.value)
                        }
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        Secondary CTA Label
                      </label>
                      <input
                        type="text"
                        value={str('secondaryCtaLabel')}
                        onChange={(e) =>
                          updateSectionField(index, 'secondaryCtaLabel', e.target.value)
                        }
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        Secondary CTA Link
                      </label>
                      <input
                        type="text"
                        value={str('secondaryCtaHref')}
                        onChange={(e) =>
                          updateSectionField(index, 'secondaryCtaHref', e.target.value)
                        }
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        Video URL (optional MP4/WebM)
                      </label>
                      <input
                        type="text"
                        value={str('videoUrl')}
                        onChange={(e) =>
                          updateSectionField(index, 'videoUrl', e.target.value || null)
                        }
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        Poster Image URL
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          value={str('posterUrl')}
                          onChange={(e) =>
                            updateSectionField(index, 'posterUrl', e.target.value || null)
                          }
                          className="flex-1 border border-border bg-paper px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setMediaTarget({
                              index,
                              field: 'posterUrl',
                              idField: 'posterMediaId',
                            })
                          }
                          className="border border-border px-3 py-2 text-xs uppercase hover:border-graphite"
                        >
                          Pick
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}

                {sec.type === 'RICH_TEXT' || sec.type === 'IMAGE_TEXT' ? (
                  <>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        Eyebrow
                      </label>
                      <input
                        type="text"
                        value={str('eyebrow')}
                        onChange={(e) => updateSectionField(index, 'eyebrow', e.target.value)}
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        Heading
                      </label>
                      <input
                        type="text"
                        value={str('heading')}
                        onChange={(e) => updateSectionField(index, 'heading', e.target.value)}
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs text-olive uppercase">Body</label>
                      <textarea
                        rows={4}
                        value={str('body')}
                        onChange={(e) => updateSectionField(index, 'body', e.target.value)}
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    {sec.type === 'IMAGE_TEXT' ? (
                      <>
                        <div className="sm:col-span-2">
                          <label className="block font-mono text-xs text-olive uppercase">
                            Supporting Image URL
                          </label>
                          <div className="mt-1 flex gap-2">
                            <input
                              type="text"
                              value={str('imageUrl')}
                              onChange={(e) =>
                                updateSectionField(index, 'imageUrl', e.target.value || null)
                              }
                              className="flex-1 border border-border bg-paper px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setMediaTarget({ index, field: 'imageUrl', idField: 'mediaId' })
                              }
                              className="border border-border px-3 py-2 text-xs uppercase hover:border-graphite"
                            >
                              Pick
                            </button>
                          </div>
                        </div>
                        <div className="sm:col-span-2 space-y-3 border-t border-border pt-4">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-olive uppercase">
                              Items / Cards
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const current = Array.isArray(c.items) ? c.items : [];
                                updateSectionField(index, 'items', [
                                  ...current,
                                  { label: '', detail: '' },
                                ]);
                              }}
                              className="border border-border px-2.5 py-1 text-xs uppercase hover:border-graphite"
                            >
                              + Add Item
                            </button>
                          </div>
                          {(Array.isArray(c.items) ? c.items : []).map((rawItem, itemIdx) => {
                            const item =
                              rawItem && typeof rawItem === 'object'
                                ? (rawItem as { label?: string; detail?: string })
                                : {};
                            return (
                              <div
                                key={itemIdx}
                                className="grid gap-2 border border-border bg-paper p-3 sm:grid-cols-12"
                              >
                                <input
                                  type="text"
                                  placeholder="Label"
                                  value={typeof item.label === 'string' ? item.label : ''}
                                  onChange={(e) => {
                                    const current = Array.isArray(c.items) ? [...c.items] : [];
                                    current[itemIdx] = { ...item, label: e.target.value };
                                    updateSectionField(index, 'items', current);
                                  }}
                                  className="border border-border bg-surface px-2.5 py-1.5 text-sm sm:col-span-4"
                                />
                                <input
                                  type="text"
                                  placeholder="Detail"
                                  value={typeof item.detail === 'string' ? item.detail : ''}
                                  onChange={(e) => {
                                    const current = Array.isArray(c.items) ? [...c.items] : [];
                                    current[itemIdx] = { ...item, detail: e.target.value };
                                    updateSectionField(index, 'items', current);
                                  }}
                                  className="border border-border bg-surface px-2.5 py-1.5 text-sm sm:col-span-7"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(c.items) ? [...c.items] : [];
                                    current.splice(itemIdx, 1);
                                    updateSectionField(index, 'items', current);
                                  }}
                                  className="text-xs text-accent uppercase hover:underline sm:col-span-1"
                                >
                                  Del
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : null}
                  </>
                ) : null}

                {sec.type === 'PROJECT_GRID' || sec.type === 'SERVICES_GRID' ? (
                  <>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        Eyebrow
                      </label>
                      <input
                        type="text"
                        value={str('eyebrow')}
                        onChange={(e) => updateSectionField(index, 'eyebrow', e.target.value)}
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        Heading
                      </label>
                      <input
                        type="text"
                        value={str('heading')}
                        onChange={(e) => updateSectionField(index, 'heading', e.target.value)}
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs text-olive uppercase">Intro</label>
                      <input
                        type="text"
                        value={str('intro')}
                        onChange={(e) => updateSectionField(index, 'intro', e.target.value)}
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                ) : null}

                {sec.type === 'CTA' ? (
                  <>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        Heading
                      </label>
                      <input
                        type="text"
                        value={str('heading')}
                        onChange={(e) => updateSectionField(index, 'heading', e.target.value)}
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        CTA Label
                      </label>
                      <input
                        type="text"
                        value={str('ctaLabel')}
                        onChange={(e) => updateSectionField(index, 'ctaLabel', e.target.value)}
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        CTA Link
                      </label>
                      <input
                        type="text"
                        value={str('ctaHref')}
                        onChange={(e) => updateSectionField(index, 'ctaHref', e.target.value)}
                        className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-olive uppercase">
                        Background Image URL
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          value={str('backgroundUrl')}
                          onChange={(e) =>
                            updateSectionField(index, 'backgroundUrl', e.target.value || null)
                          }
                          className="flex-1 border border-border bg-paper px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setMediaTarget({
                              index,
                              field: 'backgroundUrl',
                              idField: 'backgroundMediaId',
                            })
                          }
                          className="border border-border px-3 py-2 text-xs uppercase hover:border-graphite"
                        >
                          Pick
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <MediaPickerModal
        open={mediaTarget !== null}
        onClose={() => setMediaTarget(null)}
        onSelect={handleMediaSelect}
      />
    </form>
  );
}

export default function AdminEditPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.pages.detail(slug),
    queryFn: () => adminApi.getPage(slug),
  });

  if (isLoading) return <LoadingSkeleton rows={5} />;

  if (isError || !data) {
    return (
      <ErrorState
        title="Unable to load page"
        message={error instanceof Error ? error.message : 'Page not found.'}
        onRetry={() => void refetch()}
      />
    );
  }

  return <PageEditorInner key={data.updatedAt} page={data} />;
}
