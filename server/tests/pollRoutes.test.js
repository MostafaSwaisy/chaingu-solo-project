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

async function registerAndLogin(app, username) {
  await request(app).post('/api/auth/register').send({ username, email: `${username}@test.com`, password: 'secret123' });
  const res = await request(app).post('/api/auth/login').send({ identifier: username, password: 'secret123' });
  return res.body.token;
}

describe('POST /api/polls', () => {
  it('requires authentication', async () => {
    const res = await request(createApp()).post('/api/polls').send({ question: 'Q?', options: ['A', 'B'] });
    expect(res.status).toBe(401);
  });

  it('creates a poll for an authenticated user', async () => {
    const app = createApp();
    const token = await registerAndLogin(app, 'alice');
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'Best color?', options: ['Red', 'Blue'] });
    expect(res.status).toBe(201);
    expect(res.body.poll.question).toBe('Best color?');
  });
});

describe('GET /api/polls and /api/polls/:id', () => {
  it('lists polls without requiring authentication', async () => {
    const app = createApp();
    const token = await registerAndLogin(app, 'alice');
    await request(app).post('/api/polls').set('Authorization', `Bearer ${token}`).send({ question: 'Q?', options: ['A', 'B'] });
    const res = await request(app).get('/api/polls');
    expect(res.status).toBe(200);
    expect(res.body.polls).toHaveLength(1);
  });

  it('returns 404 for a missing poll', async () => {
    const res = await request(createApp()).get('/api/polls/000000000000000000000000');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/polls/:id/vote', () => {
  it('rejects a double vote with 409', async () => {
    const app = createApp();
    const ownerToken = await registerAndLogin(app, 'alice');
    const voterToken = await registerAndLogin(app, 'bob');
    const createRes = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: 'Q?', options: ['A', 'B'] });
    const pollId = createRes.body.poll.id;
    await request(app).post(`/api/polls/${pollId}/vote`).set('Authorization', `Bearer ${voterToken}`).send({ optionIndex: 0 });
    const res = await request(app).post(`/api/polls/${pollId}/vote`).set('Authorization', `Bearer ${voterToken}`).send({ optionIndex: 1 });
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/polls/:id', () => {
  it('rejects deletion by a non-owner with 403', async () => {
    const app = createApp();
    const ownerToken = await registerAndLogin(app, 'alice');
    const otherToken = await registerAndLogin(app, 'bob');
    const createRes = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: 'Q?', options: ['A', 'B'] });
    const pollId = createRes.body.poll.id;
    const res = await request(app).delete(`/api/polls/${pollId}`).set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
  });

  it('allows the owner to delete with 204', async () => {
    const app = createApp();
    const ownerToken = await registerAndLogin(app, 'alice');
    const createRes = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: 'Q?', options: ['A', 'B'] });
    const pollId = createRes.body.poll.id;
    const res = await request(app).delete(`/api/polls/${pollId}`).set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(204);
  });
});
