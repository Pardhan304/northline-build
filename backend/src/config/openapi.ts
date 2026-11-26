export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Northline Build API',
    version: '1.0.0',
    description: 'REST API for Northline Build public website and CMS administration panel.',
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  paths: {
    '/health': { get: { summary: 'Process and database readiness check', tags: ['Health'] } },
    '/projects': { get: { summary: 'List published projects', tags: ['Public'] } },
    '/projects/{slug}': { get: { summary: 'Get published project by slug', tags: ['Public'] } },
    '/pages/{slug}': {
      get: { summary: 'Get published page and visible sections', tags: ['Public'] },
    },
    '/services': { get: { summary: 'List published services', tags: ['Public'] } },
    '/settings/public': { get: { summary: 'Get public site settings', tags: ['Public'] } },
    '/enquiries': { post: { summary: 'Submit a contact enquiry', tags: ['Public'] } },
    '/auth/csrf': { get: { summary: 'Issue CSRF double-submit token', tags: ['Auth'] } },
    '/auth/login': { post: { summary: 'Authenticate administrator or editor', tags: ['Auth'] } },
    '/auth/logout': { post: { summary: 'Revoke session and clear cookies', tags: ['Auth'] } },
    '/auth/me': { get: { summary: 'Get current authenticated user', tags: ['Auth'] } },
    '/admin/dashboard': { get: { summary: 'Admin dashboard summary', tags: ['Admin'] } },
    '/admin/projects': {
      get: { summary: 'List all non-deleted projects', tags: ['Admin Projects'] },
      post: { summary: 'Create a draft project', tags: ['Admin Projects'] },
    },
    '/admin/projects/{id}': {
      get: { summary: 'Get project by ID', tags: ['Admin Projects'] },
      patch: { summary: 'Update project', tags: ['Admin Projects'] },
      delete: { summary: 'Archive/soft-delete project', tags: ['Admin Projects'] },
    },
    '/admin/projects/{id}/publish': {
      post: { summary: 'Publish a project', tags: ['Admin Projects'] },
    },
    '/admin/projects/{id}/unpublish': {
      post: { summary: 'Return a project to draft', tags: ['Admin Projects'] },
    },
    '/admin/pages': { get: { summary: 'List CMS pages', tags: ['Admin Pages'] } },
    '/admin/pages/{slug}': {
      get: { summary: 'Get CMS page for editing', tags: ['Admin Pages'] },
      patch: { summary: 'Update CMS page and sections', tags: ['Admin Pages'] },
    },
    '/admin/services': {
      get: { summary: 'List services', tags: ['Admin Services'] },
      post: { summary: 'Create service', tags: ['Admin Services'] },
    },
    '/admin/services/{id}': {
      patch: { summary: 'Update service', tags: ['Admin Services'] },
      delete: { summary: 'Archive service', tags: ['Admin Services'] },
    },
    '/admin/media': {
      get: { summary: 'List media assets', tags: ['Admin Media'] },
      post: { summary: 'Upload and process image media', tags: ['Admin Media'] },
    },
    '/admin/media/{id}': {
      patch: { summary: 'Update media alt text', tags: ['Admin Media'] },
      delete: { summary: 'Delete unreferenced media asset', tags: ['Admin Media'] },
    },
    '/admin/enquiries': { get: { summary: 'List enquiries', tags: ['Admin Enquiries'] } },
    '/admin/enquiries/{id}': {
      get: { summary: 'Get enquiry detail', tags: ['Admin Enquiries'] },
      patch: { summary: 'Update enquiry status/notes/assignee', tags: ['Admin Enquiries'] },
    },
    '/admin/settings': {
      get: { summary: 'Read all site settings', tags: ['Admin Settings'] },
      patch: { summary: 'Update site settings (ADMIN only)', tags: ['Admin Settings'] },
    },
    '/admin/audit-logs': {
      get: { summary: 'Read audit history (ADMIN only)', tags: ['Admin Audit'] },
    },
    '/admin/users': {
      get: { summary: 'List users (ADMIN only)', tags: ['Admin Users'] },
      post: { summary: 'Create user (ADMIN only)', tags: ['Admin Users'] },
    },
    '/admin/users/{id}': {
      patch: { summary: 'Update user (ADMIN only)', tags: ['Admin Users'] },
    },
  },
} as const;
