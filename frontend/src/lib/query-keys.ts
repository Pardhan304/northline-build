export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (params: Record<string, unknown>) => ['projects', 'list', params] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
  },
  pages: {
    all: ['pages'] as const,
    detail: (slug: string) => ['pages', 'detail', slug] as const,
  },
  services: {
    all: ['services'] as const,
  },
  media: {
    all: ['media'] as const,
    list: (params: Record<string, unknown>) => ['media', 'list', params] as const,
  },
  enquiries: {
    all: ['enquiries'] as const,
    list: (params: Record<string, unknown>) => ['enquiries', 'list', params] as const,
    detail: (id: string) => ['enquiries', 'detail', id] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
  auditLogs: {
    list: (params: Record<string, unknown>) => ['audit-logs', 'list', params] as const,
  },
  users: {
    list: (params: Record<string, unknown>) => ['users', 'list', params] as const,
  },
} as const;
