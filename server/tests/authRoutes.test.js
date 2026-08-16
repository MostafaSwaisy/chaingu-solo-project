import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectTestDB, closeTestDB, clearTestDB } from './helpers/db.js';

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

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201', async () => {
    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@test.com', password: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('alice');
  });

  it('returns 409 for a duplicate username', async () => {
    const app = createApp();
    await request(app).post('/api/auth/register').send({ username: 'alice', email: 'a@test.com', password: 'secret123' });
    const res = await request(app).post('/api/auth/register').send({ username: 'alice', email: 'b@test.com', password: 'secret123' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_USER');
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    const app = createApp();
    await request(app).post('/api/auth/register').send({ username: 'bob', email: 'bob@test.com', password: 'secret123' });
    const res = await request(app).post('/api/auth/login').send({ username: 'bob', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('returns 401 for invalid credentials', async () => {
    const res = await request(createApp()).post('/api/auth/login').send({ username: 'ghost', password: 'nope' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
