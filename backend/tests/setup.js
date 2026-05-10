import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

global.beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://entartes:entartes_dev_password@localhost:5432/entartes';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'entartes_secret_key_2026_dev';
});

global.afterAll(() => {
  delete process.env.NODE_ENV;
  delete process.env.DATABASE_URL;
  delete process.env.JWT_SECRET;
});

global.beforeEach(() => {
  vi.clearAllMocks();
});

global.afterEach(() => {
  vi.resetAllMocks();
});

vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});