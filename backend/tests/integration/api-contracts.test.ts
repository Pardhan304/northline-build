import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mockPrisma = {
  $queryRaw: vi.fn(),
  $disconnect: vi.fn(),
  $transaction: vi.fn(),
  session: { findUnique: vi.fn() },
  project: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
  page: { findFirst: vi.fn() },
  service: { findMany: vi.fn() },
  siteSetting: { findMany: vi.fn() },
  enquiry: { create: vi.fn() },
};

vi.mock('../../src/config/database.js', () => ({
  prisma: mockPrisma,
}));

let app: ReturnType<typeof import('../../src/app.js').createApp>;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/northline';
  process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/northline';
  process.env.SESSION_SECRET = 'test-secret-minimum-32-characters-long';
  const mod = await import('../../src/app.js');
  app = mod.createApp();
});

describe('API contracts and authorization guards', () => {
  it('returns 200 on /api/v1/health when database is connected', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.database).toBe('connected');
  });

  it('returns 503 on /api/v1/health when database query fails', async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('Connection refused'));
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.data.database).toBe('unavailable');
  });

  it('returns 401 when requesting admin dashboard without session cookie', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when EDITOR attempts ADMIN-only audit logs endpoint', async () => {
    mockPrisma.session.findUnique.mockResolvedValueOnce({
      id: '11111111-1111-4111-8111-111111111111',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Editor User',
        email: 'editor@northline.test',
        role: 'EDITOR',
        isActive: true,
      },
    });

    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Cookie', ['northline_session=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 when authenticated admin mutates without CSRF token', async () => {
    mockPrisma.session.findUnique.mockResolvedValueOnce({
      id: '11111111-1111-4111-8111-111111111111',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Admin User',
        email: 'admin@northline.test',
        role: 'ADMIN',
        isActive: true,
      },
    });

    const res = await request(app)
      .post('/api/v1/admin/projects')
      .set('Cookie', ['northline_session=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'])
      .send({ title: 'Test', category: 'Commercial' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('forces PUBLISHED filter on public /api/v1/projects regardless of client query', async () => {
    mockPrisma.project.findMany.mockResolvedValueOnce([]);
    mockPrisma.project.count.mockResolvedValueOnce(0);

    const res = await request(app).get('/api/v1/projects?status=DRAFT&page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });

    const callArg = mockPrisma.project.findMany.mock.calls[0]?.[0];
    expect(callArg?.where?.status).toBe('PUBLISHED');
    expect(callArg?.where?.deletedAt).toBeNull();
  });

  it('validates public enquiry submission and returns 400 with field details on invalid input', async () => {
    const res = await request(app).post('/api/v1/enquiries').send({
      name: 'A',
      email: 'not-an-email',
      message: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
  });

  it('persists valid public enquiry and does not expose adminNotes', async () => {
    mockPrisma.enquiry.create.mockResolvedValueOnce({
      id: '33333333-3333-4333-8333-333333333333',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const res = await request(app).post('/api/v1/enquiries').send({
      name: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '+91 98765 43210',
      subject: 'Structural feasibility',
      message: 'Looking for an engineering and construction partner for an industrial facility.',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('33333333-3333-4333-8333-333333333333');
    expect(res.body.data.adminNotes).toBeUndefined();
  });
});
