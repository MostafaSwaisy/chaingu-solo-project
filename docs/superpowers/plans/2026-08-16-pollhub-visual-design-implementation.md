# PollHub Visual Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the chalkboard/tally-mark visual identity from `docs/superpowers/specs/2026-08-16-pollhub-visual-design.md` to the existing PollHub frontend, test-first for every piece of new logic.

**Architecture:** A shared token/reset layer (`tokens.css`, `index.css`) plus one CSS file per page/component, co-located with its `.jsx`. Two new pure/hook units (`groupIntoFives`, `usePrefersReducedMotion`) and one new presentational component (`TallyCount`) get unit/component tests; pure CSS and JSX className changes don't (no behavior to test).

**Tech Stack:** Plain CSS with custom properties (no new dependency), existing Vitest + React Testing Library setup.

---

### Task 1: Design tokens, global reset, and fonts

**Files:**
- Create: `client/src/styles/tokens.css`
- Create: `client/src/index.css`
- Modify: `client/index.html`
- Modify: `client/src/main.jsx`

- [ ] **Step 1: Create `client/src/styles/tokens.css`**

```css
:root {
  --ink: #1B2B27;
  --ink-soft: #22362F;
  --chalk: #F4F1E6;
  --chalk-dim: #9FB0A7;
  --marigold: #E8A33D;
  --ember: #E2603A;

  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 40px;
  --radius: 10px;
}
```

- [ ] **Step 2: Create `client/src/index.css`**

```css
* {
  box-sizing: border-box;
}

html {
  color-scheme: dark;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--ink);
  color: var(--chalk);
  font-family: var(--font-body);
  -webkit-tap-highlight-color: transparent;
  position: relative;
  overflow-x: hidden;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.035;
  z-index: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

#root {
  position: relative;
  z-index: 1;
}

a {
  color: inherit;
}

button,
input {
  font-family: inherit;
  touch-action: manipulation;
}

*:focus-visible {
  outline: 2px solid var(--marigold);
  outline-offset: 2px;
}

h1,
h2 {
  font-family: var(--font-display);
  text-wrap: balance;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 3: Modify `client/index.html`**

Replace the full file contents with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#1B2B27" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <title>PollHub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Modify `client/src/main.jsx`**

Add two imports at the top, above the `React` import:

```jsx
import './styles/tokens.css';
import './index.css';
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

- [ ] **Step 5: Verify nothing broke**

Run: `cd client && npx vitest run`
Expected: PASS — all 18 existing tests still green (this task adds no
behavior, only styling scaffolding).

- [ ] **Step 6: Commit**

```bash
git add client/src/styles/tokens.css client/src/index.css client/index.html client/src/main.jsx
git commit -m "Add chalkboard design tokens, global reset, and fonts"
```

---

### Task 2: `groupIntoFives` utility

**Files:**
- Create: `client/src/utils/groupIntoFives.js`
- Test: `client/src/utils/groupIntoFives.test.js`

- [ ] **Step 1: Write the failing tests**

Create `client/src/utils/groupIntoFives.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { groupIntoFives } from './groupIntoFives.js';

describe('groupIntoFives', () => {
  it('returns no groups and no remainder for zero', () => {
    expect(groupIntoFives(0)).toEqual({ fullGroups: 0, remainder: 0 });
  });

  it('returns a remainder-only result under five', () => {
    expect(groupIntoFives(4)).toEqual({ fullGroups: 0, remainder: 4 });
  });

  it('returns exactly one full group for five', () => {
    expect(groupIntoFives(5)).toEqual({ fullGroups: 1, remainder: 0 });
  });

  it('splits into full groups and a remainder for twelve', () => {
    expect(groupIntoFives(12)).toEqual({ fullGroups: 2, remainder: 2 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx vitest run src/utils/groupIntoFives.test.js`
Expected: FAIL — cannot find `./groupIntoFives.js`

- [ ] **Step 3: Create `client/src/utils/groupIntoFives.js`**

```js
export function groupIntoFives(count) {
  return { fullGroups: Math.floor(count / 5), remainder: count % 5 };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx vitest run src/utils/groupIntoFives.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/utils/groupIntoFives.js client/src/utils/groupIntoFives.test.js
git commit -m "Add groupIntoFives utility for tally-mark rendering"
```

---

### Task 3: `usePrefersReducedMotion` hook

**Files:**
- Create: `client/src/hooks/usePrefersReducedMotion.js`
- Test: `client/src/hooks/usePrefersReducedMotion.test.js`

- [ ] **Step 1: Write the failing tests**

Create `client/src/hooks/usePrefersReducedMotion.test.js`:

```js
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePrefersReducedMotion', () => {
  it('returns true when the user prefers reduced motion', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('returns false when the user does not prefer reduced motion', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx vitest run src/hooks/usePrefersReducedMotion.test.js`
Expected: FAIL — cannot find `./usePrefersReducedMotion.js`

- [ ] **Step 3: Create `client/src/hooks/usePrefersReducedMotion.js`**

```js
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(
    () => window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handleChange = (event) => setPrefersReduced(event.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx vitest run src/hooks/usePrefersReducedMotion.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/usePrefersReducedMotion.js client/src/hooks/usePrefersReducedMotion.test.js
git commit -m "Add usePrefersReducedMotion hook"
```

---

### Task 4: `TallyCount` component

**Files:**
- Create: `client/src/components/TallyCount.jsx`
- Create: `client/src/components/TallyCount.css`
- Test: `client/src/components/TallyCount.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `client/src/components/TallyCount.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TallyCount } from './TallyCount.jsx';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js';

vi.mock('../hooks/usePrefersReducedMotion.js', () => ({
  usePrefersReducedMotion: vi.fn(),
}));

beforeEach(() => {
  usePrefersReducedMotion.mockReturnValue(false);
});

describe('TallyCount', () => {
  it('renders the numeral for the given count', () => {
    render(<TallyCount count={12} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders one stroke-group svg per full group of five plus one for the remainder', () => {
    const { container } = render(<TallyCount count={12} />);
    expect(container.querySelectorAll('svg')).toHaveLength(3);
  });

  it('renders no stroke groups for a zero count', () => {
    const { container } = render(<TallyCount count={0} />);
    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });

  it('omits the draw-in animation class when the user prefers reduced motion', () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const { container } = render(<TallyCount count={5} />);
    expect(container.querySelector('svg')).not.toHaveClass('tally-draw');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx vitest run src/components/TallyCount.test.jsx`
Expected: FAIL — cannot find `./TallyCount.jsx`

- [ ] **Step 3: Create `client/src/components/TallyCount.jsx`**

```jsx
import { groupIntoFives } from '../utils/groupIntoFives.js';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js';
import './TallyCount.css';

function TallyGroup({ strokes, animate }) {
  const verticalCount = Math.min(strokes, 4);
  const verticals = Array.from({ length: verticalCount }, (_, i) => i);
  const hasSlash = strokes === 5;

  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      className={animate ? 'tally-draw' : ''}
      aria-hidden="true"
    >
      {verticals.map((i) => (
        <line key={i} x1={4 + i * 5} y1="2" x2={4 + i * 5} y2="22" />
      ))}
      {hasSlash && <line x1="2" y1="22" x2="22" y2="2" />}
    </svg>
  );
}

export function TallyCount({ count }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { fullGroups, remainder } = groupIntoFives(count);
  const groups = [
    ...Array.from({ length: fullGroups }, () => 5),
    ...(remainder > 0 ? [remainder] : []),
  ];

  return (
    <span className="tally-count">
      <span className="tally-strokes">
        {groups.map((strokes, i) => (
          <TallyGroup key={i} strokes={strokes} animate={!prefersReducedMotion} />
        ))}
      </span>
      <span className="tally-number">{count}</span>
    </span>
  );
}
```

- [ ] **Step 4: Create `client/src/components/TallyCount.css`**

```css
.tally-count {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.tally-strokes {
  display: inline-flex;
  gap: 3px;
}

.tally-strokes line {
  stroke: var(--chalk-dim);
  stroke-width: 2;
  stroke-linecap: round;
}

.tally-draw line {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: tally-draw-in 240ms ease-out forwards;
}

.tally-number {
  color: var(--chalk);
  font-weight: 600;
}

@keyframes tally-draw-in {
  to {
    stroke-dashoffset: 0;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd client && npx vitest run src/components/TallyCount.test.jsx`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add client/src/components/TallyCount.jsx client/src/components/TallyCount.css client/src/components/TallyCount.test.jsx
git commit -m "Add TallyCount component"
```

---

### Task 5: App shell / navigation styling

**Files:**
- Modify: `client/src/App.jsx`
- Create: `client/src/App.css`

- [ ] **Step 1: Modify `client/src/App.jsx`**

Replace the full file contents with:

```jsx
import { Routes, Route, Link } from 'react-router-dom';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { PollList } from './pages/PollList.jsx';
import { CreatePoll } from './pages/CreatePoll.jsx';
import { PollDetail } from './pages/PollDetail.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import './App.css';

export default function App() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="nav">
        <Link to="/" className="nav__brand">
          PollHub
        </Link>
        <nav className="nav__links">
          {user ? (
            <>
              <Link to="/polls/new" className="nav__link">
                Create Poll
              </Link>
              <button className="nav__link nav__link--button" onClick={logout}>
                Log out ({user.username})
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav__link">
                Log in
              </Link>
              <Link to="/register" className="nav__link">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="app-main">
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
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create `client/src/App.css`**

```css
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--ink);
  border-bottom: 1px solid var(--ink-soft);
}

.nav__brand {
  font-family: var(--font-display);
  font-size: 1.25rem;
  text-decoration: none;
  color: var(--chalk);
}

.nav__links {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.nav__link {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--chalk-dim);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius);
}

.nav__link:hover {
  color: var(--marigold);
}

.nav__link--button {
  font-family: var(--font-body);
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4);
}

@media (max-width: 480px) {
  .nav {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .app-main {
    padding: var(--space-4) var(--space-3);
  }
}
```

- [ ] **Step 3: Verify nothing broke**

Run: `cd client && npx vitest run`
Expected: PASS — all existing tests still green (no behavior changed,
only markup structure and classNames).

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx client/src/App.css
git commit -m "Style app shell and navigation"
```

---

### Task 6: Poll List — visual design, empty state, TallyCount

**Files:**
- Modify: `client/src/pages/PollList.jsx`
- Create: `client/src/pages/PollList.css`
- Modify: `client/src/pages/PollList.test.jsx`

- [ ] **Step 1: Write the failing test for the empty state**

Add this test to `client/src/pages/PollList.test.jsx`, inside the
existing `describe('PollList page', ...)` block:

```jsx
  it('shows an empty-state message when there are no polls', async () => {
    api.get.mockResolvedValueOnce({ data: { polls: [] } });
    render(
      <MemoryRouter>
        <PollList />
      </MemoryRouter>
    );
    expect(await screen.findByText('No polls yet. Start one.')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `cd client && npx vitest run src/pages/PollList.test.jsx`
Expected: FAIL — "No polls yet. Start one." not found (renders an empty
`<ul>` instead)

- [ ] **Step 3: Modify `client/src/pages/PollList.jsx`**

Replace the full file contents with:

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios.js';
import { TallyCount } from '../components/TallyCount.jsx';
import './PollList.css';

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

  if (loading) return <p className="poll-list__status">Loading polls…</p>;
  if (error) return <p role="alert" className="poll-list__status">{error}</p>;

  if (polls.length === 0) {
    return <p className="poll-list__status">No polls yet. Start one.</p>;
  }

  return (
    <div>
      <h1 className="poll-list__heading">Polls</h1>
      <ul className="poll-list">
        {polls.map((poll) => (
          <li key={poll.id} className="poll-card">
            <Link to={`/polls/${poll.id}`} className="poll-card__link">
              <span className="poll-card__question">{poll.question}</span>
              <TallyCount count={poll.totalVotes} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Create `client/src/pages/PollList.css`**

```css
.poll-list__status {
  font-family: var(--font-body);
  color: var(--chalk-dim);
}

.poll-list__heading {
  margin-bottom: var(--space-4);
}

.poll-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.poll-card {
  background: var(--ink-soft);
  border-radius: var(--radius);
}

.poll-card__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  text-decoration: none;
  color: var(--chalk);
}

.poll-card__question {
  font-family: var(--font-display);
  font-size: 1.1rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd client && npx vitest run src/pages/PollList.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/PollList.jsx client/src/pages/PollList.css client/src/pages/PollList.test.jsx
git commit -m "Style poll list with tally counts and an empty state"
```

---

### Task 7: Poll Detail — visual design, live tally, accessible vote marker

**Files:**
- Modify: `client/src/pages/PollDetail.jsx`
- Create: `client/src/pages/PollDetail.css`
- Modify: `client/src/pages/PollDetail.test.jsx`

- [ ] **Step 1: Write the failing test for the accessible vote marker**

Add this test to `client/src/pages/PollDetail.test.jsx`, inside the
existing `describe('PollDetail page', ...)` block:

```jsx
  it('exposes an accessible label on the option the user voted for', async () => {
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
    expect(await screen.findByText('(your vote)')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `cd client && npx vitest run src/pages/PollDetail.test.jsx`
Expected: FAIL — "(your vote)" not found

- [ ] **Step 3: Modify `client/src/pages/PollDetail.jsx`**

Replace the full file contents with:

```jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { calculateResults } from '../utils/calculateResults.js';
import { TallyCount } from '../components/TallyCount.jsx';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js';
import './PollDetail.css';

export function PollDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const prefersReducedMotion = usePrefersReducedMotion();

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
      setError(err.response?.data?.error?.message || "Vote didn't go through. Try again.");
    }
  }

  if (error) return <p role="alert" className="poll-detail__status">{error}</p>;
  if (!poll) return <p className="poll-detail__status">Loading…</p>;

  const hasVoted = poll.votedOptionIndex !== null;

  if (!user || !hasVoted) {
    return (
      <div>
        <h1 className="poll-detail__question">{poll.question}</h1>
        {!user && <p className="poll-detail__status">Log in to vote.</p>}
        {user && (
          <form onSubmit={handleVote} className="poll-vote-form">
            {poll.options.map((opt, i) => (
              <label key={i} className="poll-vote-row">
                <input
                  type="radio"
                  name="option"
                  checked={selectedOption === i}
                  onChange={() => setSelectedOption(i)}
                />
                {opt.text}
              </label>
            ))}
            {error && <p role="alert" className="poll-detail__status">{error}</p>}
            <button type="submit" className="poll-vote-form__submit">
              Vote
            </button>
          </form>
        )}
      </div>
    );
  }

  const results = calculateResults(poll.options);
  const leadingVotes = Math.max(...results.map((r) => r.votes));

  return (
    <div>
      <h1 className="poll-detail__question">{poll.question}</h1>
      <ul className="poll-results" aria-live="polite">
        {results.map((opt, i) => {
          const isMine = poll.votedOptionIndex === i;
          const isLeading = opt.votes === leadingVotes && leadingVotes > 0;
          return (
            <li key={opt.text} className="poll-result-row">
              <div className="poll-result-row__label">
                <span>{opt.text}</span>
                {isMine && (
                  <span className="poll-result-row__mine">
                    <span aria-hidden="true" className="poll-result-row__mine-dot" />
                    <span>(your vote)</span>
                  </span>
                )}
              </div>
              <div className="poll-result-row__bar-track">
                <div
                  className={
                    'poll-result-row__bar' +
                    (isLeading ? ' poll-result-row__bar--leading' : '') +
                    (prefersReducedMotion ? ' poll-result-row__bar--static' : '')
                  }
                  style={{ transform: `scaleX(${opt.percentage / 100})` }}
                />
              </div>
              <div className="poll-result-row__meta">
                <TallyCount count={opt.votes} />
                <span className="poll-result-row__percentage">{opt.percentage}%</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Create `client/src/pages/PollDetail.css`**

```css
.poll-detail__question {
  margin-bottom: var(--space-4);
}

.poll-detail__status {
  color: var(--chalk-dim);
}

.poll-vote-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.poll-vote-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--ink-soft);
  border-radius: var(--radius);
  cursor: pointer;
}

.poll-vote-form__submit {
  align-self: flex-start;
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--marigold);
  color: var(--ink);
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
}

.poll-vote-form__submit:hover {
  filter: brightness(1.08);
}

.poll-results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.poll-result-row__label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.poll-result-row__mine {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 0.8rem;
  color: var(--ember);
}

.poll-result-row__mine-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ember);
  display: inline-block;
}

.poll-result-row__bar-track {
  height: 10px;
  border-radius: 999px;
  background: var(--ink-soft);
  overflow: hidden;
}

.poll-result-row__bar {
  height: 100%;
  width: 100%;
  transform-origin: left;
  background: var(--chalk-dim);
  transition: transform 320ms ease-out;
}

.poll-result-row__bar--leading {
  background: var(--marigold);
}

.poll-result-row__bar--static {
  transition: none;
}

.poll-result-row__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-1);
}

.poll-result-row__percentage {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--chalk-dim);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd client && npx vitest run src/pages/PollDetail.test.jsx`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/PollDetail.jsx client/src/pages/PollDetail.css client/src/pages/PollDetail.test.jsx
git commit -m "Style poll detail with live tally bars and accessible vote marker"
```

---

### Task 8: Create Poll — visual design

**Files:**
- Modify: `client/src/pages/CreatePoll.jsx`
- Create: `client/src/pages/CreatePoll.css`

- [ ] **Step 1: Modify `client/src/pages/CreatePoll.jsx`**

Replace the full file contents with:

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios.js';
import './CreatePoll.css';

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
    <form onSubmit={handleSubmit} className="create-poll">
      <h1 className="create-poll__heading">Create Poll</h1>
      <label className="create-poll__field">
        Question
        <input
          className="create-poll__input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </label>
      {options.map((opt, i) => (
        <div key={i} className="create-poll__option-row">
          <label className="create-poll__field">
            {`Option ${i + 1}`}
            <input
              className="create-poll__input"
              autoComplete="off"
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
            />
          </label>
          {options.length > 2 && (
            <button
              type="button"
              className="create-poll__remove"
              onClick={() => removeOption(i)}
            >
              Remove
            </button>
          )}
        </div>
      ))}
      {options.length < 6 && (
        <button type="button" className="create-poll__add" onClick={addOption}>
          + Add option
        </button>
      )}
      {error && <p role="alert" className="create-poll__error">{error}</p>}
      <button type="submit" className="create-poll__submit">
        Create poll
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create `client/src/pages/CreatePoll.css`**

```css
.create-poll {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 480px;
}

.create-poll__heading {
  margin-bottom: var(--space-2);
}

.create-poll__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: 0.85rem;
  color: var(--chalk-dim);
}

.create-poll__input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--ink-soft);
  padding: var(--space-2) 0;
  color: var(--chalk);
  font-size: 1rem;
}

.create-poll__input:focus-visible {
  border-bottom-color: var(--marigold);
}

.create-poll__option-row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}

.create-poll__remove {
  background: none;
  border: none;
  color: var(--ember);
  cursor: pointer;
  font-size: 0.85rem;
  padding-bottom: var(--space-2);
}

.create-poll__add {
  align-self: flex-start;
  background: none;
  border: 1px dashed var(--ink-soft);
  border-radius: var(--radius);
  color: var(--chalk-dim);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
}

.create-poll__add:hover {
  color: var(--marigold);
  border-color: var(--marigold);
}

.create-poll__error {
  color: var(--ember);
}

.create-poll__submit {
  align-self: flex-start;
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--marigold);
  color: var(--ink);
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
}

.create-poll__submit:hover {
  filter: brightness(1.08);
}
```

- [ ] **Step 3: Verify nothing broke**

Run: `cd client && npx vitest run src/pages/CreatePoll.test.jsx`
Expected: PASS (3 tests) — no behavior changed, only classNames and the
`autoComplete="off"` attribute on option inputs.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/CreatePoll.jsx client/src/pages/CreatePoll.css
git commit -m "Style create poll page as a chalk baseline form"
```

---

### Task 9: Login — submitting label, autocomplete, visual design

**Files:**
- Modify: `client/src/pages/Login.jsx`
- Modify: `client/src/pages/Login.test.jsx`
- Create: `client/src/pages/Auth.css`

- [ ] **Step 1: Write the failing test for the submitting label**

Add this test to `client/src/pages/Login.test.jsx`, inside the existing
`describe('Login page', ...)` block:

```jsx
  it('shows a loading label while the request is in flight', async () => {
    let resolveLogin;
    const login = vi.fn(() => new Promise((resolve) => { resolveLogin = resolve; }));
    useAuth.mockReturnValue({ login });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByRole('button', { name: 'Logging in…' })).toBeInTheDocument();
    resolveLogin();
  });
```

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `cd client && npx vitest run src/pages/Login.test.jsx`
Expected: FAIL — no button named "Logging in…" (button still reads
"Log in" while submitting)

- [ ] **Step 3: Modify `client/src/pages/Login.jsx`**

Replace the full file contents with:

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Auth.css';

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
    <form onSubmit={handleSubmit} className="auth-form">
      <h1 className="auth-form__heading">Log in</h1>
      <label className="auth-form__field">
        Username
        <input
          className="auth-form__input"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>
      <label className="auth-form__field">
        Password
        <input
          className="auth-form__input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p role="alert" className="auth-form__error">{error}</p>}
      <button type="submit" className="auth-form__submit" disabled={submitting}>
        {submitting ? 'Logging in…' : 'Log in'}
      </button>
      <p className="auth-form__switch">
        No account? <Link to="/register">Register</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 4: Create `client/src/pages/Auth.css`**

```css
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 360px;
  margin: 0 auto;
  background: var(--ink-soft);
  padding: var(--space-5) var(--space-4);
  border-radius: var(--radius);
}

.auth-form__heading {
  margin: 0 0 var(--space-2);
  text-align: center;
}

.auth-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: 0.85rem;
  color: var(--chalk-dim);
}

.auth-form__input {
  background: var(--ink);
  border: 1px solid transparent;
  border-radius: var(--radius);
  padding: var(--space-2) var(--space-3);
  color: var(--chalk);
  font-size: 1rem;
}

.auth-form__input:focus-visible {
  border-color: var(--marigold);
}

.auth-form__error {
  color: var(--ember);
  font-size: 0.85rem;
}

.auth-form__submit {
  padding: var(--space-2) var(--space-4);
  background: var(--marigold);
  color: var(--ink);
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
}

.auth-form__submit:hover {
  filter: brightness(1.08);
}

.auth-form__submit:disabled {
  opacity: 0.7;
  cursor: default;
}

.auth-form__switch {
  text-align: center;
  font-size: 0.85rem;
  color: var(--chalk-dim);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd client && npx vitest run src/pages/Login.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Login.jsx client/src/pages/Login.test.jsx client/src/pages/Auth.css
git commit -m "Style login page and show a loading label while submitting"
```

---

### Task 10: Register — submitting label, autocomplete, visual design

**Files:**
- Modify: `client/src/pages/Register.jsx`
- Modify: `client/src/pages/Register.test.jsx`

- [ ] **Step 1: Write the failing test for the submitting label**

Add this test to `client/src/pages/Register.test.jsx`, inside the
existing `describe('Register page', ...)` block:

```jsx
  it('shows a loading label while the request is in flight', async () => {
    let resolveRegister;
    const register = vi.fn(() => new Promise((resolve) => { resolveRegister = resolve; }));
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
    expect(screen.getByRole('button', { name: 'Creating account…' })).toBeInTheDocument();
    resolveRegister();
  });
```

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `cd client && npx vitest run src/pages/Register.test.jsx`
Expected: FAIL — no button named "Creating account…"

- [ ] **Step 3: Modify `client/src/pages/Register.jsx`**

Replace the full file contents with:

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Auth.css';

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
    <form onSubmit={handleSubmit} className="auth-form">
      <h1 className="auth-form__heading">Register</h1>
      <label className="auth-form__field">
        Username
        <input
          className="auth-form__input"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>
      <label className="auth-form__field">
        Email
        <input
          className="auth-form__input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="auth-form__field">
        Password
        <input
          className="auth-form__input"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p role="alert" className="auth-form__error">{error}</p>}
      <button type="submit" className="auth-form__submit" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Register'}
      </button>
      <p className="auth-form__switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx vitest run src/pages/Register.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Register.jsx client/src/pages/Register.test.jsx
git commit -m "Style register page and show a loading label while submitting"
```

---

### Task 11: Full verification and visual QA

**Files:** none (verification only)

- [ ] **Step 1: Run the full frontend test suite**

Run: `cd client && npx vitest run`
Expected: PASS — all tests green (original 18 + new tests from Tasks
2, 3, 4, 6, 7, 9, 10)

- [ ] **Step 2: Run the full backend test suite (unaffected, confirm no regression)**

Run: `cd server && npx vitest run`
Expected: PASS — 34 tests green (this plan touches frontend only)

- [ ] **Step 3: Manual visual check**

Start both dev servers and open the app in a browser:

```bash
cd server && npm run dev &
cd client && npm run dev &
```

Visit the printed Vite URL and confirm: chalkboard background renders,
Fraunces appears on poll questions only, vote counts show as tally
marks + numerals in mono type, voting animates a result bar filling in,
and keyboard-only Tab navigation shows a visible marigold focus ring on
every interactive element.

- [ ] **Step 4: Commit any final fixups, then stop**

If manual QA surfaces a bug, fix it with its own test-first cycle and
commit; otherwise this task ends the plan.
