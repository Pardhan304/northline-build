export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  error: {
    code: string;
    details: ApiErrorDetail[];
  };
}

export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type MediaRole = 'COVER' | 'GALLERY';
export type EnquiryStatus = 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED';
export type UserRole = 'ADMIN' | 'EDITOR';
export type SectionType =
  | 'HERO'
  | 'RICH_TEXT'
  | 'IMAGE_TEXT'
  | 'PROJECT_GRID'
  | 'SERVICES_GRID'
  | 'CTA'
  | 'STATISTICS'
  | 'GALLERY';

export interface MediaVariantInfo {
  key: string;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface MediaVariantsMap {
  thumbnail?: MediaVariantInfo;
  card?: MediaVariantInfo;
  hero?: MediaVariantInfo;
}

export interface MediaDto {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  storageProvider: string;
  publicUrl: string | null;
  variants: MediaVariantsMap | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMediaDto {
  mediaId: string;
  role: MediaRole;
  sortOrder: number;
  publicUrl: string | null;
  altText: string;
  width: number | null;
  height: number | null;
  variants: MediaVariantsMap | null;
}

export interface ProjectDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  category: string;
  location: string | null;
  area: string | null;
  clientName: string | null;
  completionDate: string | null;
  status: PublishStatus;
  isFeatured: boolean;
  sortOrder: number;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  media: ProjectMediaDto[];
}

export interface PageSectionDto {
  id: string;
  sectionKey: string;
  type: SectionType;
  content: Record<string, unknown>;
  sortOrder: number;
  isVisible: boolean;
}

export interface PageDto {
  id: string;
  slug: string;
  title: string;
  status: PublishStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  updatedAt: string;
  sections: PageSectionDto[];
}

export interface ServiceDto {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  status: PublishStatus;
  sortOrder: number;
  iconKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicGeneralSettings {
  companyName?: string;
  tagline?: string;
  footerStatement?: string;
}

export interface PublicContactSettings {
  email?: string;
  phone?: string;
  address?: string;
  businessHours?: string;
}

export interface PublicSocialSettings {
  linkedinUrl?: string;
  instagramUrl?: string;
}

export interface PublicSeoSettings {
  defaultTitle?: string;
  defaultDescription?: string;
}

export interface PublicSettingsDto {
  general?: PublicGeneralSettings;
  contact?: PublicContactSettings;
  social?: PublicSocialSettings;
  seo?: PublicSeoSettings;
}

export interface AuthenticatedUserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface AdminUserDto extends AuthenticatedUserDto {
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEnquiryDto {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  projectType: string | null;
  projectLocation: string | null;
  projectArea: string | null;
  expectedStart: string | null;
  subject: string | null;
  message: string;
  status: EnquiryStatus;
  adminNotes: string | null;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummaryDto {
  counts: {
    publishedProjects: number;
    draftProjects: number;
    newEnquiries: number;
    totalEnquiries: number;
    totalMedia: number;
    publishedServices: number;
  };
  recentEnquiries: Array<{
    id: string;
    name: string;
    email: string;
    subject: string | null;
    status: EnquiryStatus;
    createdAt: string;
  }>;
  recentProjects: Array<{
    id: string;
    title: string;
    slug: string;
    status: PublishStatus;
    updatedAt: string;
  }>;
}

export interface AuditLogDto {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
}
