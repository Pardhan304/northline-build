import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { signRevalidationPayload } from '../../src/lib/revalidation.js';

const mockTx = {
  project: { create: vi.fn(), update: vi.fn() },
  projectMedia: { deleteMany: vi.fn() },
  media: { count: vi.fn(), delete: vi.fn() },
  auditLog: { create: vi.fn() },
};

const mockPrisma = {
  $queryRaw: vi.fn(),
  $disconnect: vi.fn(),
  $transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
  session: { findUnique: vi.fn() },
  project: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  projectMedia: { count: vi.fn() },
  pageSection: { findMany: vi.fn() },
  media: { findFirst: vi.fn() },
  auditLog: { create: vi.fn() },
};

vi.mock('../../src/config/database.js', () => ({
  prisma: mockPrisma,
}));

let app: ReturnType<typeof import('../../src/app.js').createApp>;

const SESSION_COOKIE = `northline_session=${'a'.repeat(64)}`;
const CSRF_TOKEN = 'b'.repeat(64);
const CSRF_COOKIE = `northline_csrf=${CSRF_TOKEN}`;

function mockActiveSession(role: 'ADMIN' | 'EDITOR' = 'ADMIN', isActive = true) {
  mockPrisma.session.findUnique.mockResolvedValueOnce({
    id: '11111111-1111-4111-8111-111111111111',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    user: {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Test User',
      email: 'test@northline.test',
      role,
      isActive,
    },
  });
}

beforeAll(async () => {
  const mod = await import('../../src/app.js');
  app = mod.createApp();
});

describe('Auth lifecycle, RBAC, and CSRF enforcement', () => {
  it('rejects expired session with 401', async () => {
    mockPrisma.session.findUnique.mockResolvedValueOnce({
      id: '11111111-1111-4111-8111-111111111111',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 10_000),
      user: {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Expired',
        email: 'expired@northline.test',
        role: 'ADMIN',
        isActive: true,
      },
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [SESSION_COOKIE]);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects disabled user account with 401', async () => {
    mockActiveSession('ADMIN', false);
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [SESSION_COOKIE]);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('forbids EDITOR from updating site settings (403)', async () => {
    mockActiveSession('EDITOR');
    const res = await request(app)
      .patch('/api/v1/admin/settings')
      .set('Cookie', [SESSION_COOKIE, CSRF_COOKIE])
      .set('X-CSRF-Token', CSRF_TOKEN)
      .send({ general: { companyName: 'Northline Build' } });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects state-changing request when CSRF header mismatches cookie', async () => {
    mockActiveSession('ADMIN');
    const res = await request(app)
      .post('/api/v1/admin/projects')
      .set('Cookie', [SESSION_COOKIE, CSRF_COOKIE])
      .set('X-CSRF-Token', 'c'.repeat(64))
      .send({ title: 'Bridge A', category: 'Civil' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('CMS projects publishing & media reference safety', () => {
  it('returns 409 Conflict when creating a project with a duplicate slug', async () => {
    mockActiveSession('ADMIN');
    mockPrisma.project.findUnique.mockResolvedValueOnce({ id: 'existing-id' });

    const res = await request(app)
      .post('/api/v1/admin/projects')
      .set('Cookie', [SESSION_COOKIE, CSRF_COOKIE])
      .set('X-CSRF-Token', CSRF_TOKEN)
      .send({ title: 'Timber Hub', slug: 'timber-hub', category: 'Commercial' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('blocks publishing a project missing required excerpt/description (400)', async () => {
    mockActiveSession('EDITOR');
    mockPrisma.project.findFirst.mockResolvedValueOnce({
      id: '33333333-3333-4333-8333-333333333333',
      title: 'Draft Only',
      slug: 'draft-only',
      excerpt: '',
      description: '',
      category: 'Commercial',
      publishedAt: null,
    });

    const res = await request(app)
      .post('/api/v1/admin/projects/33333333-3333-4333-8333-333333333333/publish')
      .set('Cookie', [SESSION_COOKIE, CSRF_COOKIE])
      .set('X-CSRF-Token', CSRF_TOKEN);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
  });

  it('publishes valid project and returns PUBLISHED status', async () => {
    mockActiveSession('EDITOR');
    const id = '33333333-3333-4333-8333-333333333333';
    mockPrisma.project.findFirst.mockResolvedValueOnce({
      id,
      title: 'Civic Centre',
      slug: 'civic-centre',
      excerpt: 'Structural steel and concrete civic building.',
      description: 'Full case study details.',
      category: 'Civic',
      publishedAt: null,
    });
    mockTx.project.update.mockResolvedValueOnce({
      id,
      title: 'Civic Centre',
      slug: 'civic-centre',
      excerpt: 'Structural steel and concrete civic building.',
      description: 'Full case study details.',
      category: 'Civic',
      location: null,
      clientName: null,
      completionDate: null,
      status: 'PUBLISHED',
      isFeatured: true,
      sortOrder: 0,
      publishedAt: new Date(),
      seoTitle: null,
      seoDescription: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      media: [],
    });

    const res = await request(app)
      .post(`/api/v1/admin/projects/${id}/publish`)
      .set('Cookie', [SESSION_COOKIE, CSRF_COOKIE])
      .set('X-CSRF-Token', CSRF_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PUBLISHED');
    expect(mockTx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('blocks deleting media referenced by a project with 409 Conflict', async () => {
    mockActiveSession('ADMIN');
    const mediaId = '44444444-4444-4444-8444-444444444444';
    mockPrisma.media.findFirst.mockResolvedValueOnce({
      id: mediaId,
      storageKey: 'media/sample/primary.webp',
      variants: null,
      originalName: 'site.jpg',
    });
    mockPrisma.projectMedia.count.mockResolvedValueOnce(1);
    mockPrisma.pageSection.findMany.mockResolvedValueOnce([]);

    const res = await request(app)
      .delete(`/api/v1/admin/media/${mediaId}`)
      .set('Cookie', [SESSION_COOKIE, CSRF_COOKIE])
      .set('X-CSRF-Token', CSRF_TOKEN);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('produces deterministic HMAC signature for cache revalidation', () => {
    const sig1 = signRevalidationPayload('{"tags":["projects"]}', '1700000000000', 'super-secret-value');
    const sig2 = signRevalidationPayload('{"tags":["projects"]}', '1700000000000', 'super-secret-value');
    const sigOther = signRevalidationPayload('{"tags":["pages"]}', '1700000000000', 'super-secret-value');

    expect(sig1).toHaveLength(64);
    expect(sig1).toBe(sig2);
    expect(sig1).not.toBe(sigOther);
  });
});
