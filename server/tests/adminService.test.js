import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from './helpers/db.js';
import { registerUser, loginUser } from '../src/services/authService.js';
import { createPoll } from '../src/services/pollService.js';
import {
  listUsers,
  createUser,
  softDeleteUser,
  listPollsAdmin,
  endPollNow,
  softDeletePoll,
} from '../src/services/adminService.js';

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

describe('listUsers', () => {
  it('lists all registered users', async () => {
    await registerUser({ username: 'alice', email: 'alice@test.com', password: 'secret123' });
    await registerUser({ username: 'bob', email: 'bob@test.com', password: 'secret123' });
    const users = await listUsers();
    expect(users).toHaveLength(2);
    expect(users.map((u) => u.username).sort()).toEqual(['alice', 'bob']);
  });

  it('includes soft-deleted users', async () => {
    const user = await registerUser({ username: 'alice', email: 'alice@test.com', password: 'secret123' });
    await softDeleteUser(user.id);
    const users = await listUsers();
    expect(users).toHaveLength(1);
    expect(users[0].deletedAt).not.toBeNull();
  });
});

describe('createUser', () => {
  it('creates a user that can log in', async () => {
    const user = await createUser({ username: 'carol', email: 'carol@test.com', password: 'secret123' });
    expect(user.username).toBe('carol');
    const result = await loginUser({ identifier: 'carol', password: 'secret123' });
    expect(result.user.username).toBe('carol');
  });

  it('can create an admin', async () => {
    const user = await createUser({ username: 'carol', email: 'carol@test.com', password: 'secret123', isAdmin: true });
    expect(user.isAdmin).toBe(true);
  });
});

describe('softDeleteUser', () => {
  it('prevents the user from logging in afterwards', async () => {
    const user = await registerUser({ username: 'alice', email: 'alice@test.com', password: 'secret123' });
    await softDeleteUser(user.id);
    await expect(loginUser({ identifier: 'alice', password: 'secret123' })).rejects.toThrow('invalid credentials');
  });
});

describe('listPollsAdmin', () => {
  it('includes soft-deleted polls', async () => {
    const owner = await registerUser({ username: 'alice', email: 'alice@test.com', password: 'secret123' });
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    await softDeletePoll(poll.id);
    const polls = await listPollsAdmin();
    expect(polls).toHaveLength(1);
    expect(polls[0].deletedAt).not.toBeNull();
  });
});

describe('endPollNow', () => {
  it('sets expiresAt so the poll is immediately ended', async () => {
    const owner = await registerUser({ username: 'alice', email: 'alice@test.com', password: 'secret123' });
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    const ended = await endPollNow(poll.id);
    expect(ended.isEnded).toBe(true);
  });
});
