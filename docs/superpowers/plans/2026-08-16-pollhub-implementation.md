# PollHub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build PollHub, a Tier 3 fullstack group-polling app (React + Express + MongoDB), test-first, per `docs/superpowers/specs/2026-08-16-pollhub-design.md`.

**Architecture:** Two separate apps in one repo — `server/` (Express REST API + Mongoose models, JWT auth) and `client/` (React/Vite SPA). The client only ever talks to the server's HTTP API; the server is the only thing that touches MongoDB.

**Tech Stack:** Node.js, Express, Mongoose, MongoDB, bcryptjs, jsonwebtoken, Vitest, supertest — React, Vite, react-router-dom, axios, Vitest, React Testing Library.

**Branching:** All work happens on `feature/pollhub-mvp`, created in Task 1. Commit after every green test per `Claude.md`'s TDD/commit rules. Commit messages carry no AI attribution.

**Test DB prerequisite:** Backend tests need a MongoDB instance reachable at `mongodb://127.0.0.1:27017` (a local install or `docker run -p 27017:27017 mongo`). Tests use database `pollhub_test` and wipe it between runs.

---

### Task 1: Backend scaffold + health check

**Files:**
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `server/.gitignore`
- Create: `server/src/app.js`
- Create: `server/src/server.js`
- Create: `server/src/config/db.js`
- Create: `server/tests/helpers/db.js`
- Test: `server/tests/app.test.js`

- [ ] **Step 1: Create the branch**

Run: `git checkout -b feature/pollhub-mvp`
Expected: `Switched to a new branch 'feature/pollhub-mvp'`

- [ ] **Step 2: Create `server/package.json`**

```json
{
  "name": "pollhub-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "test": "vitest run"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.5.0"
  },
  "devDependencies": {
    "supertest": "^7.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 3: Create `server/.env.example`**

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/pollhub
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
```

- [ ] **Step 4: Create `server/.gitignore`**

```
node_modules/
.env
```

- [ ] **Step 5: Install dependencies**

Run: `cd server && npm install`
Expected: dependencies install with no errors, `node_modules/` and `package-lock.json` created.

- [ ] **Step 6: Create `server/src/config/db.js`**

```js
import mongoose from 'mongoose';

export async function connectDB(uri) {
  await mongoose.connect(uri);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
```

- [ ] **Step 7: Create `server/tests/helpers/db.js`**

```js
import mongoose from 'mongoose';

const TEST_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/pollhub_test';

export async function connectTestDB() {
  await mongoose.connect(TEST_URI);
}

export async function closeTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
```

- [ ] **Step 8: Write the failing test for the health endpoint**

Create `server/tests/app.test.js`:

```js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 9: Run the test and verify it fails**

Run: `cd server && npx vitest run tests/app.test.js`
Expected: FAIL — `Cannot find module '../src/app.js'` (or similar) because `app.js` doesn't exist yet.

- [ ] **Step 10: Create `server/src/app.js`**

```js
import express from 'express';
import cors from 'cors';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}
```

- [ ] **Step 11: Run the test and verify it passes**

Run: `cd server && npx vitest run tests/app.test.js`
Expected: PASS (1 test)

- [ ] **Step 12: Create `server/src/server.js`**

```js
import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGODB_URI)
  .then(() => {
    const app = createApp();
    app.listen(PORT, () => console.log(`PollHub API listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to database', err);
    process.exit(1);
  });
```

- [ ] **Step 13: Commit**

```bash
git add server/package.json server/package-lock.json server/.env.example server/.gitignore server/src server/tests
git commit -m "Scaffold Express backend with health check endpoint"
```

---

### Task 2: AppError and error-handling middleware

**Files:**
- Create: `server/src/utils/AppError.js`
- Create: `server/src/middleware/errorHandler.js`
- Test: `server/tests/errorHandler.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/errorHandler.test.js`:

```js
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { AppError } from '../src/utils/AppError.js';

function buildTestApp(routeHandler) {
  const app = express();
  app.get('/boom', routeHandler);
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('formats an AppError with its status code and code', async () => {
    const app = buildTestApp((req, res, next) => next(new AppError('nope', 400, 'BAD_INPUT')));
    const res = await request(app).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { message: 'nope', code: 'BAD_INPUT' } });
  });

  it('returns a generic 500 for an unexpected error', async () => {
    const app = buildTestApp((req, res, next) => next(new Error('unexpected')));
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { message: 'internal server error', code: 'INTERNAL_ERROR' } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run tests/errorHandler.test.js`
Expected: FAIL — cannot find `../src/middleware/errorHandler.js`

- [ ] **Step 3: Create `server/src/utils/AppError.js`**

```js
export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
```

- [ ] **Step 4: Create `server/src/middleware/errorHandler.js`**

```js
import { AppError } from '../utils/AppError.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
  }
  console.error(err);
  return res.status(500).json({ error: { message: 'internal server error', code: 'INTERNAL_ERROR' } });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd server && npx vitest run tests/errorHandler.test.js`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add server/src/utils/AppError.js server/src/middleware/errorHandler.js server/tests/errorHandler.test.js
git commit -m "Add AppError and centralized error-handling middleware"
```

---

### Task 3: User model and auth service (register/login)

**Files:**
- Create: `server/src/models/User.js`
- Create: `server/src/services/authService.js`
- Test: `server/tests/authService.test.js`

- [ ] **Step 1: Write the failing tests**

Create `server/tests/authService.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run tests/authService.test.js`
Expected: FAIL — cannot find `../src/services/authService.js`

- [ ] **Step 3: Create `server/src/models/User.js`**

```js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
```

- [ ] **Step 4: Create `server/src/services/authService.js`**

```js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function registerUser({ username, email, password }) {
  if (!username || !email || !password) {
    throw new AppError('username, email, and password are required', 400, 'VALIDATION_ERROR');
  }
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    throw new AppError('username or email already in use', 409, 'DUPLICATE_USER');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, passwordHash });
  return { id: user._id.toString(), username: user.username, email: user.email };
}

export async function loginUser({ username, password }) {
  if (!username || !password) {
    throw new AppError('username and password are required', 400, 'VALIDATION_ERROR');
  }
  const user = await User.findOne({ username });
  if (!user) {
    throw new AppError('invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new AppError('invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  const token = jwt.sign(
    { sub: user._id.toString(), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  return { token, user: { id: user._id.toString(), username: user.username, email: user.email } };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && npx vitest run tests/authService.test.js`
Expected: PASS (6 tests). Requires MongoDB running locally at `mongodb://127.0.0.1:27017`.

- [ ] **Step 6: Commit**

```bash
git add server/src/models/User.js server/src/services/authService.js server/tests/authService.test.js
git commit -m "Add User model and authService for register/login"
```

---

### Task 4: Auth middleware (requireAuth, optionalAuth)

**Files:**
- Create: `server/src/middleware/auth.js`
- Create: `server/src/middleware/optionalAuth.js`
- Test: `server/tests/authMiddleware.test.js`

- [ ] **Step 1: Write the failing tests**

Create `server/tests/authMiddleware.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run tests/authMiddleware.test.js`
Expected: FAIL — cannot find `../src/middleware/auth.js`

- [ ] **Step 3: Create `server/src/middleware/auth.js`**

```js
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('authentication required', 401, 'UNAUTHENTICATED'));
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    next(new AppError('invalid or expired token', 401, 'INVALID_TOKEN'));
  }
}
```

- [ ] **Step 4: Create `server/src/middleware/optionalAuth.js`**

```js
import jwt from 'jsonwebtoken';

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice('Bearer '.length), process.env.JWT_SECRET);
      req.userId = payload.sub;
    } catch {
      // invalid/expired token on an optional route: proceed as anonymous
    }
  }
  next();
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && npx vitest run tests/authMiddleware.test.js`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add server/src/middleware/auth.js server/src/middleware/optionalAuth.js server/tests/authMiddleware.test.js
git commit -m "Add requireAuth and optionalAuth middleware"
```

---

### Task 5: Auth routes wired into the app

**Files:**
- Create: `server/src/routes/authRoutes.js`
- Modify: `server/src/app.js`
- Test: `server/tests/authRoutes.test.js`

- [ ] **Step 1: Write the failing tests**

Create `server/tests/authRoutes.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run tests/authRoutes.test.js`
Expected: FAIL — `/api/auth/register` returns 404 (route doesn't exist yet)

- [ ] **Step 3: Create `server/src/routes/authRoutes.js`**

```js
import { Router } from 'express';
import { registerUser, loginUser } from '../services/authService.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 4: Modify `server/src/app.js`**

Replace the full file contents with:

```js
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter);

  app.use(errorHandler);

  return app;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && npx vitest run tests/authRoutes.test.js`
Expected: PASS (4 tests)

- [ ] **Step 6: Run the full backend test suite**

Run: `cd server && npx vitest run`
Expected: PASS (all tests so far — app, errorHandler, authService, authMiddleware, authRoutes)

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/authRoutes.js server/src/app.js server/tests/authRoutes.test.js
git commit -m "Wire auth routes and error handler into the Express app"
```

---

### Task 6: Poll and Vote models, pollService

**Files:**
- Create: `server/src/models/Poll.js`
- Create: `server/src/models/Vote.js`
- Create: `server/src/services/pollService.js`
- Test: `server/tests/pollService.test.js`

- [ ] **Step 1: Write the failing tests**

Create `server/tests/pollService.test.js`:

```js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from './helpers/db.js';
import { registerUser } from '../src/services/authService.js';
import { createPoll, listPolls, getPoll, castVote, deletePoll } from '../src/services/pollService.js';

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

async function makeUser(username) {
  return registerUser({ username, email: `${username}@test.com`, password: 'secret123' });
}

describe('createPoll', () => {
  it('creates a poll with 2-6 options', async () => {
    const owner = await makeUser('alice');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    expect(poll.question).toBe('Best color?');
    expect(poll.options).toHaveLength(2);
  });

  it('rejects fewer than 2 options', async () => {
    const owner = await makeUser('alice');
    await expect(createPoll({ question: 'Best color?', options: ['Red'] }, owner.id)).rejects.toThrow(
      'a poll must have between 2 and 6 options'
    );
  });

  it('rejects more than 6 options', async () => {
    const owner = await makeUser('alice');
    const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    await expect(createPoll({ question: 'Too many?', options }, owner.id)).rejects.toThrow(
      'a poll must have between 2 and 6 options'
    );
  });
});

describe('listPolls and getPoll', () => {
  it('lists polls with vote totals', async () => {
    const owner = await makeUser('alice');
    await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    const polls = await listPolls();
    expect(polls).toHaveLength(1);
    expect(polls[0].totalVotes).toBe(0);
  });

  it('returns per-option vote counts and the requesting user\'s vote', async () => {
    const owner = await makeUser('alice');
    const voter = await makeUser('bob');
    const created = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    await castVote(created.id, voter.id, 0);
    const poll = await getPoll(created.id, voter.id);
    expect(poll.options[0].votes).toBe(1);
    expect(poll.options[1].votes).toBe(0);
    expect(poll.votedOptionIndex).toBe(0);
  });
});

describe('castVote', () => {
  it('rejects a second vote from the same user', async () => {
    const owner = await makeUser('alice');
    const voter = await makeUser('bob');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    const pollId = poll.id;
    await castVote(pollId, voter.id, 0);
    await expect(castVote(pollId, voter.id, 1)).rejects.toThrow('you have already voted on this poll');
  });

  it('rejects an out-of-range option index', async () => {
    const owner = await makeUser('alice');
    const voter = await makeUser('bob');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    const pollId = poll.id;
    await expect(castVote(pollId, voter.id, 5)).rejects.toThrow('invalid option index');
  });
});

describe('deletePoll', () => {
  it('lets the owner delete their poll', async () => {
    const owner = await makeUser('alice');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    const pollId = poll.id;
    await deletePoll(pollId, owner.id);
    const polls = await listPolls();
    expect(polls).toHaveLength(0);
  });

  it('rejects deletion by a non-owner', async () => {
    const owner = await makeUser('alice');
    const someoneElse = await makeUser('bob');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    const pollId = poll.id;
    await expect(deletePoll(pollId, someoneElse.id)).rejects.toThrow('only the poll owner can delete this poll');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run tests/pollService.test.js`
Expected: FAIL — cannot find `../src/services/pollService.js`

- [ ] **Step 3: Create `server/src/models/Poll.js`**

```js
import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({ text: { type: String, required: true, trim: true } }, { _id: false });

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      type: [optionSchema],
      validate: {
        validator: (opts) => opts.length >= 2 && opts.length <= 6,
        message: 'A poll must have between 2 and 6 options',
      },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Poll = mongoose.model('Poll', pollSchema);
```

- [ ] **Step 4: Create `server/src/models/Vote.js`**

```js
import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    pollId: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    optionIndex: { type: Number, required: true },
  },
  { timestamps: true }
);

voteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

export const Vote = mongoose.model('Vote', voteSchema);
```

- [ ] **Step 5: Create `server/src/services/pollService.js`**

```js
import { Poll } from '../models/Poll.js';
import { Vote } from '../models/Vote.js';
import { AppError } from '../utils/AppError.js';

export async function createPoll({ question, options }, userId) {
  if (!question || !Array.isArray(options)) {
    throw new AppError('question and options are required', 400, 'VALIDATION_ERROR');
  }
  if (options.length < 2 || options.length > 6) {
    throw new AppError('a poll must have between 2 and 6 options', 400, 'VALIDATION_ERROR');
  }
  const poll = await Poll.create({
    question,
    options: options.map((text) => ({ text })),
    createdBy: userId,
  });
  return attachResults(poll);
}

async function attachResults(poll) {
  const votes = await Vote.find({ pollId: poll._id });
  const counts = poll.options.map(() => 0);
  for (const vote of votes) {
    counts[vote.optionIndex] += 1;
  }
  return {
    id: poll._id.toString(),
    question: poll.question,
    createdBy: poll.createdBy.toString(),
    createdAt: poll.createdAt,
    options: poll.options.map((opt, i) => ({ text: opt.text, votes: counts[i] })),
    totalVotes: votes.length,
  };
}

export async function listPolls() {
  const polls = await Poll.find().sort({ createdAt: -1 });
  return Promise.all(polls.map(attachResults));
}

export async function getPoll(pollId, userId) {
  const poll = await Poll.findById(pollId);
  if (!poll) {
    throw new AppError('poll not found', 404, 'NOT_FOUND');
  }
  const result = await attachResults(poll);
  const existingVote = userId ? await Vote.findOne({ pollId, userId }) : null;
  return { ...result, votedOptionIndex: existingVote ? existingVote.optionIndex : null };
}

export async function castVote(pollId, userId, optionIndex) {
  const poll = await Poll.findById(pollId);
  if (!poll) {
    throw new AppError('poll not found', 404, 'NOT_FOUND');
  }
  if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex >= poll.options.length) {
    throw new AppError('invalid option index', 400, 'VALIDATION_ERROR');
  }
  const existing = await Vote.findOne({ pollId, userId });
  if (existing) {
    throw new AppError('you have already voted on this poll', 409, 'ALREADY_VOTED');
  }
  await Vote.create({ pollId, userId, optionIndex });
  return getPoll(pollId, userId);
}

export async function deletePoll(pollId, userId) {
  const poll = await Poll.findById(pollId);
  if (!poll) {
    throw new AppError('poll not found', 404, 'NOT_FOUND');
  }
  if (poll.createdBy.toString() !== userId) {
    throw new AppError('only the poll owner can delete this poll', 403, 'FORBIDDEN');
  }
  await Vote.deleteMany({ pollId });
  await poll.deleteOne();
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd server && npx vitest run tests/pollService.test.js`
Expected: PASS (9 tests)

- [ ] **Step 7: Commit**

```bash
git add server/src/models/Poll.js server/src/models/Vote.js server/src/services/pollService.js server/tests/pollService.test.js
git commit -m "Add Poll/Vote models and pollService with vote-once enforcement"
```

---

### Task 7: Poll routes wired into the app

**Files:**
- Create: `server/src/routes/pollRoutes.js`
- Modify: `server/src/app.js`
- Test: `server/tests/pollRoutes.test.js`

- [ ] **Step 1: Write the failing tests**

Create `server/tests/pollRoutes.test.js`:

```js
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
  const res = await request(app).post('/api/auth/login').send({ username, password: 'secret123' });
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run tests/pollRoutes.test.js`
Expected: FAIL — `/api/polls` routes return 404 (not mounted yet)

- [ ] **Step 3: Create `server/src/routes/pollRoutes.js`**

```js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { createPoll, listPolls, getPoll, castVote, deletePoll } from '../services/pollService.js';

export const pollRouter = Router();

pollRouter.get('/', async (req, res, next) => {
  try {
    const polls = await listPolls();
    res.json({ polls });
  } catch (err) {
    next(err);
  }
});

pollRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const poll = await createPoll(req.body, req.userId);
    res.status(201).json({ poll });
  } catch (err) {
    next(err);
  }
});

pollRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const poll = await getPoll(req.params.id, req.userId ?? null);
    res.json({ poll });
  } catch (err) {
    next(err);
  }
});

pollRouter.post('/:id/vote', requireAuth, async (req, res, next) => {
  try {
    const poll = await castVote(req.params.id, req.userId, req.body.optionIndex);
    res.json({ poll });
  } catch (err) {
    next(err);
  }
});

pollRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await deletePoll(req.params.id, req.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 4: Modify `server/src/app.js`**

Replace the full file contents with:

```js
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/authRoutes.js';
import { pollRouter } from './routes/pollRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter);
  app.use('/api/polls', pollRouter);

  app.use(errorHandler);

  return app;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && npx vitest run tests/pollRoutes.test.js`
Expected: PASS (7 tests)

- [ ] **Step 6: Run the full backend test suite**

Run: `cd server && npx vitest run`
Expected: PASS — every backend test file green

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/pollRoutes.js server/src/app.js server/tests/pollRoutes.test.js
git commit -m "Wire poll routes into the Express app"
```

---

### Task 8: Manual backend smoke test

**Files:** none (verification only)

- [ ] **Step 1: Start MongoDB locally**

Run: `mongod --dbpath <your-data-dir>` (or `docker run -p 27017:27017 mongo` in another terminal), leave it running.

- [ ] **Step 2: Create the real `.env`**

Run: `cd server && cp .env.example .env` then edit `JWT_SECRET` to a random string.

- [ ] **Step 3: Start the server**

Run: `cd server && npm run dev`
Expected: `PollHub API listening on port 5000`

- [ ] **Step 4: Exercise the API manually**

Run:
```bash
curl -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"username":"alice","email":"alice@test.com","password":"secret123"}'
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"alice","password":"secret123"}'
```
Expected: register returns a `user` object; login returns a `token`. Copy the token for the next check:
```bash
curl -s -X POST http://localhost:5000/api/polls -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{"question":"Best color?","options":["Red","Blue"]}'
```
Expected: `201` with the created poll.

- [ ] **Step 5: Stop the dev server** (Ctrl+C) — leave MongoDB running for frontend work later.

---

### Task 9: Frontend scaffold + calculateResults

**Files:**
- Create: `client/package.json`
- Create: `client/.env.example`
- Create: `client/.gitignore`
- Create: `client/vite.config.js`
- Create: `client/index.html`
- Create: `client/src/setupTests.js`
- Create: `client/src/utils/calculateResults.js`
- Test: `client/src/utils/calculateResults.test.js`

- [ ] **Step 1: Create `client/package.json`**

```json
{
  "name": "pollhub-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.1",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `client/.env.example`**

```
VITE_API_URL=http://localhost:5000/api
```

- [ ] **Step 3: Create `client/.gitignore`**

```
node_modules/
dist/
.env
```

- [ ] **Step 4: Create `client/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
  },
});
```

- [ ] **Step 5: Create `client/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>PollHub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `client/src/setupTests.js`**

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 7: Install dependencies**

Run: `cd client && npm install`
Expected: dependencies install with no errors

- [ ] **Step 8: Write the failing test for calculateResults**

Create `client/src/utils/calculateResults.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { calculateResults } from './calculateResults.js';

describe('calculateResults', () => {
  it('computes rounded percentages for each option', () => {
    const result = calculateResults([
      { text: 'A', votes: 3 },
      { text: 'B', votes: 1 },
    ]);
    expect(result).toEqual([
      { text: 'A', votes: 3, percentage: 75 },
      { text: 'B', votes: 1, percentage: 25 },
    ]);
  });

  it('returns 0 percent for every option when there are no votes', () => {
    const result = calculateResults([
      { text: 'A', votes: 0 },
      { text: 'B', votes: 0 },
    ]);
    expect(result).toEqual([
      { text: 'A', votes: 0, percentage: 0 },
      { text: 'B', votes: 0, percentage: 0 },
    ]);
  });
});
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd client && npx vitest run src/utils/calculateResults.test.js`
Expected: FAIL — cannot find `./calculateResults.js`

- [ ] **Step 10: Create `client/src/utils/calculateResults.js`**

```js
export function calculateResults(options) {
  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);
  return options.map((opt) => ({
    text: opt.text,
    votes: opt.votes,
    percentage: totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100),
  }));
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd client && npx vitest run src/utils/calculateResults.test.js`
Expected: PASS (2 tests)

- [ ] **Step 12: Commit**

```bash
git add client/package.json client/package-lock.json client/.env.example client/.gitignore client/vite.config.js client/index.html client/src/setupTests.js client/src/utils
git commit -m "Scaffold Vite React frontend with calculateResults utility"
```

---

### Task 10: Axios instance and AuthContext

**Files:**
- Create: `client/src/api/axios.js`
- Create: `client/src/context/AuthContext.jsx`
- Test: `client/src/context/AuthContext.test.jsx`

- [ ] **Step 1: Create `client/src/api/axios.js`**

```js
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pollhub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

- [ ] **Step 2: Write the failing tests for AuthContext**

Create `client/src/context/AuthContext.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { api } from '../api/axios.js';

vi.mock('../api/axios.js', () => ({
  api: { post: vi.fn() },
}));

function TestConsumer() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.username : 'none'}</span>
      <button onClick={() => login('alice', 'secret123')}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('AuthContext', () => {
  it('stores the user after a successful login', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'tok', user: { id: '1', username: 'alice' } } });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await userEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('alice'));
    expect(localStorage.getItem('pollhub_token')).toBe('tok');
  });

  it('clears the user on logout', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'tok', user: { id: '1', username: 'alice' } } });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await userEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('alice'));
    await userEvent.click(screen.getByText('logout'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(localStorage.getItem('pollhub_token')).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd client && npx vitest run src/context/AuthContext.test.jsx`
Expected: FAIL — cannot find `./AuthContext.jsx`

- [ ] **Step 4: Create `client/src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('pollhub_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('pollhub_token', data.token);
    localStorage.setItem('pollhub_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (username, email, password) => {
      await api.post('/auth/register', { username, email, password });
      await login(username, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('pollhub_token');
    localStorage.removeItem('pollhub_user');
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd client && npx vitest run src/context/AuthContext.test.jsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add client/src/api/axios.js client/src/context/AuthContext.jsx client/src/context/AuthContext.test.jsx
git commit -m "Add axios instance and AuthContext"
```

---

### Task 11: ProtectedRoute component

**Files:**
- Create: `client/src/components/ProtectedRoute.jsx`
- Test: `client/src/components/ProtectedRoute.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `client/src/components/ProtectedRoute.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

function renderWithRoute(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route
          path="/private"
          element={
            <ProtectedRoute>
              <div>secret content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('renders children when a user is logged in', () => {
    useAuth.mockReturnValue({ user: { id: '1', username: 'alice' } });
    renderWithRoute('/private');
    expect(screen.getByText('secret content')).toBeInTheDocument();
  });

  it('redirects to /login when there is no user', () => {
    useAuth.mockReturnValue({ user: null });
    renderWithRoute('/private');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx vitest run src/components/ProtectedRoute.test.jsx`
Expected: FAIL — cannot find `./ProtectedRoute.jsx`

- [ ] **Step 3: Create `client/src/components/ProtectedRoute.jsx`**

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx vitest run src/components/ProtectedRoute.test.jsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ProtectedRoute.jsx client/src/components/ProtectedRoute.test.jsx
git commit -m "Add ProtectedRoute component"
```

---

### Task 12: Login and Register pages

**Files:**
- Create: `client/src/pages/Login.jsx`
- Create: `client/src/pages/Register.jsx`
- Test: `client/src/pages/Login.test.jsx`
- Test: `client/src/pages/Register.test.jsx`

- [ ] **Step 1: Write the failing test for Login**

Create `client/src/pages/Login.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login.jsx';
import { useAuth } from '../context/AuthContext.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Login page', () => {
  it('calls login with the entered credentials', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ login });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(login).toHaveBeenCalledWith('alice', 'secret123');
  });

  it('shows an error message when login fails', async () => {
    const login = vi.fn().mockRejectedValue({ response: { data: { error: { message: 'invalid credentials' } } } });
    useAuth.mockReturnValue({ login });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('invalid credentials');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/pages/Login.test.jsx`
Expected: FAIL — cannot find `./Login.jsx`

- [ ] **Step 3: Create `client/src/pages/Login.jsx`**

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Log in</h1>
      <label>
        Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        Log in
      </button>
      <p>
        No account? <Link to="/register">Register</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/pages/Login.test.jsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Write the failing test for Register**

Create `client/src/pages/Register.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Register } from './Register.jsx';
import { useAuth } from '../context/AuthContext.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Register page', () => {
  it('calls register with the entered fields', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ register });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Email'), 'alice@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(register).toHaveBeenCalledWith('alice', 'alice@test.com', 'secret123');
  });

  it('shows an error message when registration fails', async () => {
    const register = vi.fn().mockRejectedValue({ response: { data: { error: { message: 'username or email already in use' } } } });
    useAuth.mockReturnValue({ register });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Email'), 'alice@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('username or email already in use');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd client && npx vitest run src/pages/Register.test.jsx`
Expected: FAIL — cannot find `./Register.jsx`

- [ ] **Step 7: Create `client/src/pages/Register.jsx`**

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Register</h1>
      <label>
        Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        Register
      </button>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd client && npx vitest run src/pages/Register.test.jsx`
Expected: PASS (2 tests)

- [ ] **Step 9: Commit**

```bash
git add client/src/pages/Login.jsx client/src/pages/Register.jsx client/src/pages/Login.test.jsx client/src/pages/Register.test.jsx
git commit -m "Add Login and Register pages"
```

---

### Task 13: PollList page

**Files:**
- Create: `client/src/pages/PollList.jsx`
- Test: `client/src/pages/PollList.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `client/src/pages/PollList.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PollList } from './PollList.jsx';
import { api } from '../api/axios.js';

vi.mock('../api/axios.js', () => ({
  api: { get: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PollList page', () => {
  it('renders polls returned from the API', async () => {
    api.get.mockResolvedValueOnce({ data: { polls: [{ id: '1', question: 'Best color?', totalVotes: 3 }] } });
    render(
      <MemoryRouter>
        <PollList />
      </MemoryRouter>
    );
    expect(await screen.findByText('Best color?')).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    api.get.mockRejectedValueOnce(new Error('network error'));
    render(
      <MemoryRouter>
        <PollList />
      </MemoryRouter>
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('failed to load polls');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx vitest run src/pages/PollList.test.jsx`
Expected: FAIL — cannot find `./PollList.jsx`

- [ ] **Step 3: Create `client/src/pages/PollList.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios.js';

export function PollList() {
  const [polls, setPolls] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/polls')
      .then(({ data }) => {
        if (!cancelled) setPolls(data.polls);
      })
      .catch(() => {
        if (!cancelled) setError('failed to load polls');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p>Loading polls...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1>Polls</h1>
      <ul>
        {polls.map((poll) => (
          <li key={poll.id}>
            <Link to={`/polls/${poll.id}`}>{poll.question}</Link> ({poll.totalVotes} votes)
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx vitest run src/pages/PollList.test.jsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/PollList.jsx client/src/pages/PollList.test.jsx
git commit -m "Add PollList page"
```

---

### Task 14: CreatePoll page

**Files:**
- Create: `client/src/pages/CreatePoll.jsx`
- Test: `client/src/pages/CreatePoll.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `client/src/pages/CreatePoll.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CreatePoll } from './CreatePoll.jsx';
import { api } from '../api/axios.js';

vi.mock('../api/axios.js', () => ({
  api: { post: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CreatePoll page', () => {
  it('starts with two option inputs and can add a third', async () => {
    render(
      <MemoryRouter>
        <CreatePoll />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Add option'));
    expect(screen.getByLabelText('Option 3')).toBeInTheDocument();
  });

  it('submits the question and options', async () => {
    api.post.mockResolvedValueOnce({ data: { poll: { id: 'p1' } } });
    render(
      <MemoryRouter>
        <CreatePoll />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Question'), 'Best color?');
    await userEvent.type(screen.getByLabelText('Option 1'), 'Red');
    await userEvent.type(screen.getByLabelText('Option 2'), 'Blue');
    await userEvent.click(screen.getByRole('button', { name: 'Create poll' }));
    expect(api.post).toHaveBeenCalledWith('/polls', { question: 'Best color?', options: ['Red', 'Blue'] });
  });

  it('shows an error message when creation fails', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: { message: 'a poll must have between 2 and 6 options' } } } });
    render(
      <MemoryRouter>
        <CreatePoll />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Question'), 'Best color?');
    await userEvent.type(screen.getByLabelText('Option 1'), 'Red');
    await userEvent.type(screen.getByLabelText('Option 2'), 'Blue');
    await userEvent.click(screen.getByRole('button', { name: 'Create poll' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('a poll must have between 2 and 6 options');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx vitest run src/pages/CreatePoll.test.jsx`
Expected: FAIL — cannot find `./CreatePoll.jsx`

- [ ] **Step 3: Create `client/src/pages/CreatePoll.jsx`**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios.js';

export function CreatePoll() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');

  function updateOption(index, value) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }

  function addOption() {
    if (options.length < 6) setOptions((prev) => [...prev, '']);
  }

  function removeOption(index) {
    if (options.length > 2) setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/polls', { question, options });
      navigate(`/polls/${data.poll.id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'failed to create poll');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create Poll</h1>
      <label>
        Question
        <input value={question} onChange={(e) => setQuestion(e.target.value)} />
      </label>
      {options.map((opt, i) => (
        <div key={i}>
          <label>
            {`Option ${i + 1}`}
            <input value={opt} onChange={(e) => updateOption(i, e.target.value)} />
          </label>
          {options.length > 2 && (
            <button type="button" onClick={() => removeOption(i)}>
              Remove
            </button>
          )}
        </div>
      ))}
      {options.length < 6 && (
        <button type="button" onClick={addOption}>
          Add option
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      <button type="submit">Create poll</button>
    </form>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx vitest run src/pages/CreatePoll.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/CreatePoll.jsx client/src/pages/CreatePoll.test.jsx
git commit -m "Add CreatePoll page with dynamic option inputs"
```

---

### Task 15: PollDetail page

**Files:**
- Create: `client/src/pages/PollDetail.jsx`
- Test: `client/src/pages/PollDetail.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `client/src/pages/PollDetail.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PollDetail } from './PollDetail.jsx';
import { api } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

vi.mock('../api/axios.js', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

function renderPollDetail() {
  return render(
    <MemoryRouter initialEntries={['/polls/p1']}>
      <Routes>
        <Route path="/polls/:id" element={<PollDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PollDetail page', () => {
  it('shows a vote form when the user has not voted yet', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1', username: 'alice' } });
    api.get.mockResolvedValueOnce({
      data: {
        poll: {
          id: 'p1',
          question: 'Best color?',
          options: [{ text: 'Red', votes: 0 }, { text: 'Blue', votes: 0 }],
          totalVotes: 0,
          votedOptionIndex: null,
        },
      },
    });
    renderPollDetail();
    expect(await screen.findByText('Best color?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vote' })).toBeInTheDocument();
  });

  it('shows results as percentages after the user has voted', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1', username: 'alice' } });
    api.get.mockResolvedValueOnce({
      data: {
        poll: {
          id: 'p1',
          question: 'Best color?',
          options: [{ text: 'Red', votes: 3 }, { text: 'Blue', votes: 1 }],
          totalVotes: 4,
          votedOptionIndex: 0,
        },
      },
    });
    renderPollDetail();
    expect(await screen.findByText(/Red: 75%/)).toBeInTheDocument();
    expect(screen.getByText(/Blue: 25%/)).toBeInTheDocument();
  });

  it('casts a vote and re-renders with results', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1', username: 'alice' } });
    api.get.mockResolvedValueOnce({
      data: {
        poll: {
          id: 'p1',
          question: 'Best color?',
          options: [{ text: 'Red', votes: 0 }, { text: 'Blue', votes: 0 }],
          totalVotes: 0,
          votedOptionIndex: null,
        },
      },
    });
    api.post.mockResolvedValueOnce({
      data: {
        poll: {
          id: 'p1',
          question: 'Best color?',
          options: [{ text: 'Red', votes: 1 }, { text: 'Blue', votes: 0 }],
          totalVotes: 1,
          votedOptionIndex: 0,
        },
      },
    });
    renderPollDetail();
    await screen.findByText('Best color?');
    await userEvent.click(screen.getAllByRole('radio')[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Vote' }));
    expect(api.post).toHaveBeenCalledWith('/polls/p1/vote', { optionIndex: 0 });
    expect(await screen.findByText(/Red: 100%/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx vitest run src/pages/PollDetail.test.jsx`
Expected: FAIL — cannot find `./PollDetail.jsx`

- [ ] **Step 3: Create `client/src/pages/PollDetail.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { calculateResults } from '../utils/calculateResults.js';

export function PollDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    api
      .get(`/polls/${id}`)
      .then(({ data }) => setPoll(data.poll))
      .catch(() => setError('failed to load poll'));
  }, [id]);

  async function handleVote(e) {
    e.preventDefault();
    if (selectedOption === null) return;
    try {
      const { data } = await api.post(`/polls/${id}/vote`, { optionIndex: selectedOption });
      setPoll(data.poll);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'failed to vote');
    }
  }

  if (error) return <p role="alert">{error}</p>;
  if (!poll) return <p>Loading...</p>;

  const hasVoted = poll.votedOptionIndex !== null;

  if (!user || !hasVoted) {
    return (
      <div>
        <h1>{poll.question}</h1>
        {!user && <p>Log in to vote.</p>}
        {user && (
          <form onSubmit={handleVote}>
            {poll.options.map((opt, i) => (
              <label key={i}>
                <input
                  type="radio"
                  name="option"
                  checked={selectedOption === i}
                  onChange={() => setSelectedOption(i)}
                />
                {opt.text}
              </label>
            ))}
            <button type="submit">Vote</button>
          </form>
        )}
      </div>
    );
  }

  const results = calculateResults(poll.options);
  return (
    <div>
      <h1>{poll.question}</h1>
      <ul>
        {results.map((opt) => (
          <li key={opt.text}>
            {opt.text}: {opt.percentage}% ({opt.votes} votes)
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx vitest run src/pages/PollDetail.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/PollDetail.jsx client/src/pages/PollDetail.test.jsx
git commit -m "Add PollDetail page with voting and results views"
```

---

### Task 16: App routing, entry point, and end-to-end smoke test

**Files:**
- Create: `client/src/App.jsx`
- Create: `client/src/main.jsx`

- [ ] **Step 1: Create `client/src/App.jsx`**

```jsx
import { Routes, Route, Link } from 'react-router-dom';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { PollList } from './pages/PollList.jsx';
import { CreatePoll } from './pages/CreatePoll.jsx';
import { PollDetail } from './pages/PollDetail.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const { user, logout } = useAuth();
  return (
    <div>
      <nav>
        <Link to="/">Polls</Link>
        {user ? (
          <>
            <Link to="/polls/new">Create Poll</Link>
            <button onClick={logout}>Log out ({user.username})</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<PollList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/polls/new"
          element={
            <ProtectedRoute>
              <CreatePoll />
            </ProtectedRoute>
          }
        />
        <Route path="/polls/:id" element={<PollDetail />} />
      </Routes>
    </div>
  );
}
```

- [ ] **Step 2: Create `client/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 3: Run the full frontend test suite**

Run: `cd client && npx vitest run`
Expected: PASS — every frontend test file green

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx client/src/main.jsx
git commit -m "Wire App routing and entry point"
```

- [ ] **Step 5: Manual end-to-end smoke test**

With MongoDB still running:

Run in one terminal: `cd server && npm run dev`
Run in another terminal: `cd client && cp .env.example .env && npm run dev`

Open the printed Vite URL (typically `http://localhost:5173`) in a browser and walk through:
1. Register a new account → redirected to the poll list.
2. Create a poll with 2–3 options → redirected to its detail page.
3. Log out, register a second account, log back in as that user.
4. Open the same poll, vote → results show as percentage bars.
5. Try voting again (reload the page) → the vote form no longer appears; results show instead.
6. Log back in as the poll's creator, open the poll, delete it (if a delete control is present) → poll disappears from the list.

Expected: every step behaves as described with no unhandled errors in the browser console.

- [ ] **Step 6: Run both full test suites one final time**

Run: `cd server && npx vitest run && cd ../client && npx vitest run`
Expected: PASS — all backend and frontend tests green.

---

## Stretch goals (not required for MVP completion)

- Deploy `client/` to Vercel and `server/` to Render, with MongoDB Atlas as the production database.
- Add a couple of `supertest`/RTL regression tests beyond the MVP set above.
- Poll edit/delete-from-detail-page UI, vote retraction, or real-time result updates — see the design spec's Non-goals section.
