import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectTestDB, closeTestDB, clearTestDB } from './helpers/db.js';
import { registerUser } from '../src/services/authService.js';
import { createPoll } from '../src/services/pollService.js';

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

async function loginAs(app, identifier) {
  const res = await request(app).post('/api/auth/login').send({ identifier, password: 'secret123' });
  return res.body.token;
}

async function makeAdmin(app) {
  await registerUser({ username: 'admin', email: 'admin@test.com', password: 'secret123', isAdmin: true });
  return loginAs(app, 'admin');
}

async function makeRegularUser(app, username) {
  await registerUser({ username, email: `${username}@test.com`, password: 'secret123' });
  return loginAs(app, username);
}

describe('admin users routes', () => {
  it('rejects a non-admin with 403', async () => {
    const app = createApp();
    const token = await makeRegularUser(app, 'alice');
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('lists users for an admin', async () => {
    const app = createApp();
    const adminToken = await makeAdmin(app);
    await makeRegularUser(app, 'alice');
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
  });

  it('creates a user', async () => {
    const app = createApp();
    const adminToken = await makeAdmin(app);
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'carol', email: 'carol@test.com', password: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('carol');
  });

  it('soft-deletes a user', async () => {
    const app = createApp();
    const adminToken = await makeAdmin(app);
    const alice = await registerUser({ username: 'alice', email: 'alice@test.com', password: 'secret123' });
    const res = await request(app).delete(`/api/admin/users/${alice.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });
});

describe('admin polls routes', () => {
  it('lists polls for an admin', async () => {
    const app = createApp();
    const adminToken = await makeAdmin(app);
    const ownerToken = await makeRegularUser(app, 'alice');
    await request(app).post('/api/polls').set('Authorization', `Bearer ${ownerToken}`).send({ question: 'Q?', options: ['A', 'B'] });
    const res = await request(app).get('/api/admin/polls').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.polls).toHaveLength(1);
  });

  it('ends a poll immediately', async () => {
    const app = createApp();
    const adminToken = await makeAdmin(app);
    const ownerToken = await makeRegularUser(app, 'alice');
    const createRes = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: 'Q?', options: ['A', 'B'] });
    const res = await request(app)
      .post(`/api/admin/polls/${createRes.body.poll.id}/end`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.poll.isEnded).toBe(true);
  });

  it('soft-deletes a poll', async () => {
    const app = createApp();
    const adminToken = await makeAdmin(app);
    const ownerToken = await makeRegularUser(app, 'alice');
    const createRes = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: 'Q?', options: ['A', 'B'] });
    const res = await request(app)
      .delete(`/api/admin/polls/${createRes.body.poll.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });
});
