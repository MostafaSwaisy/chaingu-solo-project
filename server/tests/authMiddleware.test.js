import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../src/middleware/auth.js';
import { optionalAuth } from '../src/middleware/optionalAuth.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

process.env.JWT_SECRET = 'test_secret';

function buildTestApp() {
  const app = express();
  app.get('/protected', requireAuth, (req, res) => res.json({ userId: req.userId }));
  app.get('/optional', optionalAuth, (req, res) => res.json({ userId: req.userId ?? null }));
  app.use(errorHandler);
  return app;
}

describe('requireAuth', () => {
  it('rejects a request with no token', async () => {
    const res = await request(buildTestApp()).get('/protected');
    expect(res.status).toBe(401);
  });

  it('allows a request with a valid token', async () => {
    const token = jwt.sign({ sub: 'user1' }, process.env.JWT_SECRET);
    const res = await request(buildTestApp()).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user1');
  });

  it('rejects an invalid token', async () => {
    const res = await request(buildTestApp()).get('/protected').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });
});

describe('optionalAuth', () => {
  it('proceeds without a user when no token is present', async () => {
    const res = await request(buildTestApp()).get('/optional');
    expect(res.status).toBe(200);
    expect(res.body.userId).toBeNull();
  });

  it('attaches the user id when a valid token is present', async () => {
    const token = jwt.sign({ sub: 'user1' }, process.env.JWT_SECRET);
    const res = await request(buildTestApp()).get('/optional').set('Authorization', `Bearer ${token}`);
    expect(res.body.userId).toBe('user1');
  });
});
