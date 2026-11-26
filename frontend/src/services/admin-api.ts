import { apiRequest, buildQueryString } from '@/lib/api-client';
import type {
  AdminEnquiryDto,
  AdminUserDto,
  AuditLogDto,
  AuthenticatedUserDto,
  DashboardSummaryDto,
  EnquiryStatus,
  MediaDto,
  MediaRole,
  PageDto,
  PaginationMeta,
  ProjectDto,
  PublishStatus,
  PublicSettingsDto,
  SectionType,
  ServiceDto,
  UserRole,
} from '@/types/api';

export const adminApi = {
  async login(input: { email: string; password: string }): Promise<{ user: AuthenticatedUserDto }> {
    const res = await apiRequest<{ user: AuthenticatedUserDto }>('/auth/login', {
      method: 'POST',
      body: input,
    });
    return res.data;
  },

  async logout(): Promise<void> {
    await apiRequest<null>('/auth/logout', {
      method: 'POST',
      requireCsrf: true,
    });
  },

  async getMe(): Promise<AuthenticatedUserDto> {
    const res = await apiRequest<{ user: AuthenticatedUserDto }>('/auth/me');
    return res.data.user;
  },

  async getDashboard(): Promise<DashboardSummaryDto> {
    const res = await apiRequest<DashboardSummaryDto>('/admin/dashboard');
    return res.data;
  },

  async listProjects(params: {
    page?: number;
    limit?: number;
    status?: PublishStatus;
    category?: string;
    search?: string;
    sort?: string;
    signal?: AbortSignal;
  }): Promise<{ items: ProjectDto[]; meta: PaginationMeta }> {
    const { signal, ...query } = params;
    const res = await apiRequest<ProjectDto[]>(`/admin/projects${buildQueryString(query)}`, {
      signal,
    });
    return {
      items: res.data,
      meta: res.meta ?? { page: 1, limit: 10, total: res.data.length, totalPages: 1 },
    };
  },

  async getProject(id: string): Promise<ProjectDto> {
    const res = await apiRequest<ProjectDto>(`/admin/projects/${encodeURIComponent(id)}`);
    return res.data;
  },

  async createProject(input: {
    title: string;
    slug?: string;
    excerpt?: string;
    description?: string;
    category: string;
    location?: string | null;
    area?: string | null;
    clientName?: string | null;
    completionDate?: string | null;
    isFeatured?: boolean;
    sortOrder?: number;
    seoTitle?: string | null;
    seoDescription?: string | null;
    media?: Array<{ mediaId: string; role: MediaRole; sortOrder: number }>;
  }): Promise<ProjectDto> {
    const res = await apiRequest<ProjectDto>('/admin/projects', {
      method: 'POST',
      body: input,
      requireCsrf: true,
    });
    return res.data;
  },

  async updateProject(id: string, input: Record<string, unknown>): Promise<ProjectDto> {
    const res = await apiRequest<ProjectDto>(`/admin/projects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
      requireCsrf: true,
    });
    return res.data;
  },

  async publishProject(id: string): Promise<ProjectDto> {
    const res = await apiRequest<ProjectDto>(`/admin/projects/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      requireCsrf: true,
    });
    return res.data;
  },

  async unpublishProject(id: string): Promise<ProjectDto> {
    const res = await apiRequest<ProjectDto>(
      `/admin/projects/${encodeURIComponent(id)}/unpublish`,
      {
        method: 'POST',
        requireCsrf: true,
      },
    );
    return res.data;
  },

  async archiveProject(id: string): Promise<void> {
    await apiRequest<null>(`/admin/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      requireCsrf: true,
    });
  },

  async listPages(): Promise<PageDto[]> {
    const res = await apiRequest<PageDto[]>('/admin/pages');
    return res.data;
  },

  async getPage(slug: string): Promise<PageDto> {
    const res = await apiRequest<PageDto>(`/admin/pages/${encodeURIComponent(slug)}`);
    return res.data;
  },

  async updatePage(
    slug: string,
    input: {
      title?: string;
      status?: PublishStatus;
      seoTitle?: string | null;
      seoDescription?: string | null;
      sections?: Array<{
        sectionKey: string;
        type: SectionType;
        content: Record<string, unknown>;
        sortOrder: number;
        isVisible: boolean;
      }>;
    },
  ): Promise<PageDto> {
    const res = await apiRequest<PageDto>(`/admin/pages/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      body: input,
      requireCsrf: true,
    });
    return res.data;
  },

  async listServices(): Promise<ServiceDto[]> {
    const res = await apiRequest<ServiceDto[]>('/admin/services');
    return res.data;
  },

  async createService(input: {
    title: string;
    slug?: string;
    summary: string;
    description?: string;
    status?: PublishStatus;
    sortOrder?: number;
    iconKey?: string | null;
  }): Promise<ServiceDto> {
    const res = await apiRequest<ServiceDto>('/admin/services', {
      method: 'POST',
      body: input,
      requireCsrf: true,
    });
    return res.data;
  },

  async updateService(id: string, input: Record<string, unknown>): Promise<ServiceDto> {
    const res = await apiRequest<ServiceDto>(`/admin/services/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
      requireCsrf: true,
    });
    return res.data;
  },

  async archiveService(id: string): Promise<void> {
    await apiRequest<null>(`/admin/services/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      requireCsrf: true,
    });
  },

  async listMedia(params: {
    page?: number;
    limit?: number;
    search?: string;
    signal?: AbortSignal;
  }): Promise<{ items: MediaDto[]; meta: PaginationMeta }> {
    const { signal, ...query } = params;
    const res = await apiRequest<MediaDto[]>(`/admin/media${buildQueryString(query)}`, { signal });
    return {
      items: res.data,
      meta: res.meta ?? { page: 1, limit: 24, total: res.data.length, totalPages: 1 },
    };
  },

  async uploadMedia(file: File, altText: string): Promise<MediaDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', altText);
    const res = await apiRequest<MediaDto>('/admin/media', {
      method: 'POST',
      body: formData,
      requireCsrf: true,
    });
    return res.data;
  },

  async updateMediaAltText(id: string, altText: string): Promise<MediaDto> {
    const res = await apiRequest<MediaDto>(`/admin/media/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { altText },
      requireCsrf: true,
    });
    return res.data;
  },

  async deleteMedia(id: string): Promise<void> {
    await apiRequest<null>(`/admin/media/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      requireCsrf: true,
    });
  },

  async listEnquiries(params: {
    page?: number;
    limit?: number;
    status?: EnquiryStatus;
    search?: string;
    signal?: AbortSignal;
  }): Promise<{ items: AdminEnquiryDto[]; meta: PaginationMeta }> {
    const { signal, ...query } = params;
    const res = await apiRequest<AdminEnquiryDto[]>(`/admin/enquiries${buildQueryString(query)}`, {
      signal,
    });
    return {
      items: res.data,
      meta: res.meta ?? { page: 1, limit: 20, total: res.data.length, totalPages: 1 },
    };
  },

  async getEnquiry(id: string): Promise<AdminEnquiryDto> {
    const res = await apiRequest<AdminEnquiryDto>(`/admin/enquiries/${encodeURIComponent(id)}`);
    return res.data;
  },

  async updateEnquiry(
    id: string,
    input: { status?: EnquiryStatus; adminNotes?: string | null; assignedToId?: string | null },
  ): Promise<AdminEnquiryDto> {
    const res = await apiRequest<AdminEnquiryDto>(`/admin/enquiries/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
      requireCsrf: true,
    });
    return res.data;
  },

  async deleteEnquiry(id: string): Promise<void> {
    await apiRequest<null>(`/admin/enquiries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      requireCsrf: true,
    });
  },

  async getSettings(): Promise<PublicSettingsDto> {
    const res = await apiRequest<PublicSettingsDto>('/admin/settings');
    return res.data;
  },

  async updateSettings(input: PublicSettingsDto): Promise<PublicSettingsDto> {
    const res = await apiRequest<PublicSettingsDto>('/admin/settings', {
      method: 'PATCH',
      body: input,
      requireCsrf: true,
    });
    return res.data;
  },

  async listAuditLogs(params: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
  }): Promise<{ items: AuditLogDto[]; meta: PaginationMeta }> {
    const res = await apiRequest<AuditLogDto[]>(`/admin/audit-logs${buildQueryString(params)}`);
    return {
      items: res.data,
      meta: res.meta ?? { page: 1, limit: 20, total: res.data.length, totalPages: 1 },
    };
  },

  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ items: AdminUserDto[]; meta: PaginationMeta }> {
    const res = await apiRequest<AdminUserDto[]>(`/admin/users${buildQueryString(params)}`);
    return {
      items: res.data,
      meta: res.meta ?? { page: 1, limit: 20, total: res.data.length, totalPages: 1 },
    };
  },

  async createUser(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<AdminUserDto> {
    const res = await apiRequest<AdminUserDto>('/admin/users', {
      method: 'POST',
      body: input,
      requireCsrf: true,
    });
    return res.data;
  },

  async updateUser(
    id: string,
    input: { name?: string; role?: UserRole; isActive?: boolean; password?: string },
  ): Promise<AdminUserDto> {
    const res = await apiRequest<AdminUserDto>(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
      requireCsrf: true,
    });
    return res.data;
  },
};
