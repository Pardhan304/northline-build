import { apiRequest, buildQueryString } from '@/lib/api-client';
import { isApiError } from '@/lib/api-error';
import type {
  PageDto,
  PaginationMeta,
  ProjectDto,
  PublicSettingsDto,
  ServiceDto,
} from '@/types/api';

export interface CreateEnquiryPayload {
  name: string;
  company?: string;
  email: string;
  phone: string;
  projectType?: string;
  projectLocation?: string;
  projectArea?: string;
  expectedStart?: string;
  subject?: string;
  message: string;
}

function cacheOptions(tags: string[]): {
  cache?: RequestCache;
  next?: { revalidate: number; tags: string[] };
} {
  if (typeof window === 'undefined' && process.env.REVALIDATE_SECRET) {
    return { next: { revalidate: 60, tags } };
  }
  return { cache: 'no-store' };
}

export async function fetchPublicPage(slug: string): Promise<PageDto | null> {
  try {
    const res = await apiRequest<PageDto>(`/pages/${encodeURIComponent(slug)}`, {
      ...cacheOptions(['pages', `page:${slug}`]),
    });
    return res.data;
  } catch (err) {
    if (isApiError(err) && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function fetchPublicProjects(
  params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    featured?: boolean;
    sort?: 'publishedAt_desc' | 'sortOrder_asc' | 'title_asc';
  } = {},
): Promise<{ items: ProjectDto[]; meta: PaginationMeta }> {
  const qs = buildQueryString(params);
  const res = await apiRequest<ProjectDto[]>(`/projects${qs}`, {
    ...cacheOptions(['projects']),
  });
  return {
    items: res.data,
    meta: res.meta ?? { page: 1, limit: 10, total: res.data.length, totalPages: 1 },
  };
}

export async function fetchPublicProjectBySlug(slug: string): Promise<ProjectDto | null> {
  try {
    const res = await apiRequest<ProjectDto>(`/projects/${encodeURIComponent(slug)}`, {
      ...cacheOptions(['projects', `project:${slug}`]),
    });
    return res.data;
  } catch (err) {
    if (isApiError(err) && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function fetchPublicServices(): Promise<ServiceDto[]> {
  const res = await apiRequest<ServiceDto[]>('/services', {
    ...cacheOptions(['services']),
  });
  return res.data;
}

export async function fetchPublicSettings(): Promise<PublicSettingsDto> {
  try {
    const res = await apiRequest<PublicSettingsDto>('/settings/public', {
      ...cacheOptions(['settings']),
    });
    return res.data;
  } catch {
    return {};
  }
}

export async function submitPublicEnquiry(
  payload: CreateEnquiryPayload,
): Promise<{ id: string; createdAt: string }> {
  const res = await apiRequest<{ id: string; createdAt: string }>('/enquiries', {
    method: 'POST',
    body: payload,
  });
  return res.data;
}
