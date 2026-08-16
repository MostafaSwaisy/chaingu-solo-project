import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { requireAdmin } from '../src/middleware/requireAdmin.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { connectTestDB, closeTestDB, clearTestDB } from './helpers/db.js';
import { registerUser } from '../src/services/authService.js';

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret';
  await connectTestDB();
});
afterAll(async () => {
  await closeTestDB();
});
beforeEach(async () => {
  await clearTestDB();
});

function buildTestApp() {
  const app = express();
  app.use((req, res, next) => {
    const token = req.headers.authorization?.slice('Bearer '.length);
    req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  });
  app.get('/admin-only', requireAdmin, (req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

function tokenFor(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET);
}

describe('requireAdmin', () => {
  it('allows an admin user through', async () => {
    const admin = await registerUser({ username: 'admin', email: 'admin@test.com', password: 'secret123', isAdmin: true });
    const res = await request(buildTestApp()).get('/admin-only').set('Authorization', `Bearer ${tokenFor(admin.id)}`);
    expect(res.status).toBe(200);
  });

  it('rejects a non-admin user with 403', async () => {
    const user = await registerUser({ username: 'alice', email: 'alice@test.com', password: 'secret123' });
    const res = await request(buildTestApp()).get('/admin-only').set('Authorization', `Bearer ${tokenFor(user.id)}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
