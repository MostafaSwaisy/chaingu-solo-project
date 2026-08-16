import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from './helpers/db.js';
import { registerUser, loginUser } from '../src/services/authService.js';

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

describe('registerUser', () => {
  it('creates a user with a hashed password', async () => {
    const user = await registerUser({ username: 'alice', email: 'alice@test.com', password: 'secret123' });
    expect(user.username).toBe('alice');
    expect(user.email).toBe('alice@test.com');
    expect(user.id).toBeDefined();
  });

  it('rejects a duplicate username', async () => {
    await registerUser({ username: 'alice', email: 'alice@test.com', password: 'secret123' });
    await expect(
      registerUser({ username: 'alice', email: 'other@test.com', password: 'secret123' })
    ).rejects.toThrow('username or email already in use');
  });

  it('rejects missing fields', async () => {
    await expect(registerUser({ username: '', email: '', password: '' })).rejects.toThrow(
      'username, email, and password are required'
    );
  });
});

describe('loginUser', () => {
  it('returns a token and user for valid credentials', async () => {
    await registerUser({ username: 'bob', email: 'bob@test.com', password: 'secret123' });
    const result = await loginUser({ username: 'bob', password: 'secret123' });
    expect(result.token).toBeDefined();
    expect(result.user.username).toBe('bob');
  });

  it('rejects an invalid password', async () => {
    await registerUser({ username: 'bob', email: 'bob@test.com', password: 'secret123' });
    await expect(loginUser({ username: 'bob', password: 'wrong' })).rejects.toThrow('invalid credentials');
  });

  it('rejects an unknown username', async () => {
    await expect(loginUser({ username: 'ghost', password: 'secret123' })).rejects.toThrow('invalid credentials');
  });
});
