process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/northline_test';
process.env.DIRECT_URL ??= 'postgresql://user:pass@localhost:5432/northline_test';
process.env.SESSION_SECRET ??= 'test-secret-minimum-32-characters-long';
