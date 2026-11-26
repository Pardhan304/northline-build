'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { isApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';
import type { MediaDto, MediaRole, ProjectDto } from '@/types/api';

const projectFormSchema = z.object({
  title: z.string().trim().min(2, 'Title is required (min 2 characters).').max(180),
  slug: z.string().trim().max(180).optional(),
  category: z.string().trim().min(1, 'Category is required.').max(80),
  location: z.string().trim().max(160).optional(),
  area: z.string().trim().max(80).optional(),
  clientName: z.string().trim().max(160).optional(),
  completionDate: z.string().optional(),
  excerpt: z.string().trim().max(500),
  description: z.string().trim().max(20000),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(320).optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface AttachedMediaItem {
  mediaId: string;
  role: MediaRole;
  sortOrder: number;
  previewUrl: string | null;
  altText: string;
}

interface ProjectEditorFormProps {
  project?: ProjectDto;
}

export function ProjectEditorForm({ project }: ProjectEditorFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = Boolean(project);

  const [mediaItems, setMediaItems] = useState<AttachedMediaItem[]>(() =>
    (project?.media ?? []).map((m) => ({
      mediaId: m.mediaId,
      role: m.role,
      sortOrder: m.sortOrder,
      previewUrl: m.variants?.thumbnail?.url ?? m.publicUrl,
      altText: m.altText,
    })),
  );
  const [pickerRole, setPickerRole] = useState<MediaRole | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: project?.title ?? '',
      slug: project?.slug ?? '',
      category: project?.category ?? '',
      location: project?.location ?? '',
      area: project?.area ?? '',
      clientName: project?.clientName ?? '',
      completionDate: project?.completionDate ? project.completionDate.slice(0, 10) : '',
      excerpt: project?.excerpt ?? '',
      description: project?.description ?? '',
      isFeatured: project?.isFeatured ?? false,
      sortOrder: project?.sortOrder ?? 0,
      seoTitle: project?.seoTitle ?? '',
      seoDescription: project?.seoDescription ?? '',
    },
  });

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const invalidateProjectQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
    ]);
  };

  const publishMutation = useMutation({
    mutationFn: () => adminApi.publishProject(project!.id),
    onSuccess: async () => {
      setErrorMessage(null);
      setStatusMessage('Project published.');
      await invalidateProjectQueries();
      router.refresh();
    },
    onError: (err) => {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to publish project.');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => adminApi.unpublishProject(project!.id),
    onSuccess: async () => {
      setErrorMessage(null);
      setStatusMessage('Project returned to draft.');
      await invalidateProjectQueries();
      router.refresh();
    },
    onError: (err) => {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to unpublish project.');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => adminApi.archiveProject(project!.id),
    onSuccess: async () => {
      await invalidateProjectQueries();
      router.replace('/admin/projects');
    },
    onError: (err) => {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to archive project.');
    },
  });

  const onSubmit = async (values: ProjectFormValues) => {
    setErrorMessage(null);
    setStatusMessage(null);

    const payload = {
      title: values.title,
      slug: values.slug?.trim() || undefined,
      category: values.category,
      location: values.location?.trim() || null,
      area: values.area?.trim() || null,
      clientName: values.clientName?.trim() || null,
      completionDate: values.completionDate ? new Date(values.completionDate).toISOString() : null,
      excerpt: values.excerpt,
      description: values.description,
      isFeatured: values.isFeatured,
      sortOrder: values.sortOrder,
      seoTitle: values.seoTitle?.trim() || null,
      seoDescription: values.seoDescription?.trim() || null,
      media: mediaItems.map((m, idx) => ({
        mediaId: m.mediaId,
        role: m.role,
        sortOrder: idx,
      })),
    };

    try {
      if (isEditing && project) {
        await adminApi.updateProject(project.id, payload);
        await invalidateProjectQueries();
        setStatusMessage('Project saved.');
      } else {
        const created = await adminApi.createProject(payload);
        await invalidateProjectQueries();
        router.replace(`/admin/projects/${created.id}`);
      }
    } catch (error) {
      if (isApiError(error)) {
        for (const detail of error.details) {
          if (detail.field && detail.field in values) {
            setError(detail.field as keyof ProjectFormValues, {
              type: 'server',
              message: detail.message,
            });
          }
        }
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage('Failed to save project.');
    }
  };

  const handleSelectMedia = (media: MediaDto) => {
    if (!pickerRole) return;
    setMediaItems((prev) => {
      const filtered = prev.filter((item) => item.mediaId !== media.id);
      if (pickerRole === 'COVER') {
        const withoutOldCover = filtered.map((item) =>
          item.role === 'COVER' ? { ...item, role: 'GALLERY' as MediaRole } : item,
        );
        return [
          {
            mediaId: media.id,
            role: 'COVER',
            sortOrder: 0,
            previewUrl: media.variants?.thumbnail?.url ?? media.publicUrl,
            altText: media.altText || media.originalName,
          },
          ...withoutOldCover,
        ];
      }
      return [
        ...filtered,
        {
          mediaId: media.id,
          role: 'GALLERY',
          sortOrder: filtered.length,
          previewUrl: media.variants?.thumbnail?.url ?? media.publicUrl,
          altText: media.altText || media.originalName,
        },
      ];
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium tracking-tight">
            {isEditing ? project?.title : 'New Project'}
          </h1>
          {project ? <StatusBadge status={project.status} /> : null}
        </div>

        {project ? (
          <div className="flex flex-wrap gap-2">
            {project.status !== 'PUBLISHED' ? (
              <button
                type="button"
                disabled={publishMutation.isPending}
                onClick={() => {
                  if (window.confirm('Publish this project to the public website?')) {
                    publishMutation.mutate();
                  }
                }}
                className="border border-olive bg-olive px-4 py-2 text-xs font-semibold tracking-wider text-surface uppercase disabled:opacity-50"
              >
                {publishMutation.isPending ? 'Publishing...' : 'Publish'}
              </button>
            ) : (
              <button
                type="button"
                disabled={unpublishMutation.isPending}
                onClick={() => unpublishMutation.mutate()}
                className="border border-border bg-surface px-4 py-2 text-xs font-semibold tracking-wider uppercase hover:border-graphite disabled:opacity-50"
              >
                {unpublishMutation.isPending ? 'Unpublishing...' : 'Return to Draft'}
              </button>
            )}

            <button
              type="button"
              disabled={archiveMutation.isPending}
              onClick={() => {
                if (
                  window.confirm('Archive this project? It will be removed from public listings.')
                ) {
                  archiveMutation.mutate();
                }
              }}
              className="border border-accent/40 px-4 py-2 text-xs font-semibold tracking-wider text-accent uppercase hover:bg-accent hover:text-surface disabled:opacity-50"
            >
              Archive
            </button>
          </div>
        ) : null}
      </div>

      {statusMessage ? (
        <div role="status" className="border border-olive/40 bg-olive/10 p-3.5 text-sm">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div role="alert" className="border border-accent/50 bg-accent/10 p-3.5 text-sm">
          {errorMessage}
        </div>
      ) : null}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 border border-border bg-surface p-6 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-xs tracking-wider text-olive uppercase">
              Title *
            </label>
            <input
              type="text"
              {...register('title')}
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
            />
            {errors.title ? (
              <p className="mt-1 text-xs text-accent">{errors.title.message}</p>
            ) : null}
          </div>

          <div>
            <label className="block font-mono text-xs tracking-wider text-olive uppercase">
              Slug (auto-generated if blank)
            </label>
            <input
              type="text"
              {...register('slug')}
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2 font-mono text-sm focus:border-graphite focus:outline-none"
            />
            {errors.slug ? <p className="mt-1 text-xs text-accent">{errors.slug.message}</p> : null}
          </div>

          <div>
            <label className="block font-mono text-xs tracking-wider text-olive uppercase">
              Category *
            </label>
            <input
              type="text"
              {...register('category')}
              placeholder="e.g. Commercial, Civic, Structural"
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
            />
            {errors.category ? (
              <p className="mt-1 text-xs text-accent">{errors.category.message}</p>
            ) : null}
          </div>

          <div>
            <label className="block font-mono text-xs tracking-wider text-olive uppercase">
              Location
            </label>
            <input
              type="text"
              {...register('location')}
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-xs tracking-wider text-olive uppercase">
              Project Area (e.g. 180,000 sq. ft.)
            </label>
            <input
              type="text"
              {...register('area')}
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-xs tracking-wider text-olive uppercase">
              Client Name (optional, publishable only with permission)
            </label>
            <input
              type="text"
              {...register('clientName')}
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-xs tracking-wider text-olive uppercase">
              Completion Date
            </label>
            <input
              type="date"
              {...register('completionDate')}
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-mono text-xs tracking-wider text-olive uppercase">
              Excerpt (required before publish)
            </label>
            <textarea
              rows={2}
              {...register('excerpt')}
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-mono text-xs tracking-wider text-olive uppercase">
              Description (required before publish)
            </label>
            <textarea
              rows={8}
              {...register('description')}
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="project-featured"
              type="checkbox"
              {...register('isFeatured')}
              className="h-4 w-4 accent-accent"
            />
            <label htmlFor="project-featured" className="text-sm font-medium">
              Feature on Home page
            </label>
          </div>

          <div>
            <label className="block font-mono text-xs tracking-wider text-olive uppercase">
              Sort Order
            </label>
            <input
              type="number"
              {...register('sortOrder', { valueAsNumber: true })}
              className="mt-2 w-32 border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
            />
          </div>
        </div>

        {/* Media Attachments */}
        <div className="border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Project Media</h2>
              <p className="text-xs text-graphite/65">
                Assign a cover image and supporting gallery photographs from the Media Library.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPickerRole('COVER')}
                className="border border-graphite bg-graphite px-3.5 py-2 text-xs font-semibold tracking-wider text-surface uppercase"
              >
                Set Cover Image
              </button>
              <button
                type="button"
                onClick={() => setPickerRole('GALLERY')}
                className="border border-border bg-paper px-3.5 py-2 text-xs font-semibold tracking-wider uppercase hover:border-graphite"
              >
                Add Gallery Image
              </button>
            </div>
          </div>

          {mediaItems.length === 0 ? (
            <p className="mt-4 text-sm text-graphite/65">No images attached yet.</p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {mediaItems.map((item) => (
                <div key={item.mediaId} className="border border-border bg-paper p-2.5">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
                    {item.previewUrl ? (
                      <Image
                        src={item.previewUrl}
                        alt={item.altText}
                        fill
                        sizes="200px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] tracking-wider text-olive uppercase">
                      {item.role}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setMediaItems((prev) => prev.filter((m) => m.mediaId !== item.mediaId))
                      }
                      className="text-accent hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEO */}
        <div className="grid gap-6 border border-border bg-surface p-6 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-xs tracking-wider text-olive uppercase">
              SEO Title (optional)
            </label>
            <input
              type="text"
              {...register('seoTitle')}
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-xs tracking-wider text-olive uppercase">
              SEO Description (optional)
            </label>
            <input
              type="text"
              {...register('seoDescription')}
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2 text-sm focus:border-graphite focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="border border-graphite bg-graphite px-6 py-3 text-xs font-semibold tracking-[0.14em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Draft'}
          </button>
        </div>
      </form>

      <MediaPickerModal
        open={pickerRole !== null}
        title={pickerRole === 'COVER' ? 'Select Cover Image' : 'Add Gallery Image'}
        onClose={() => setPickerRole(null)}
        onSelect={handleSelectMedia}
      />
    </div>
  );
}
