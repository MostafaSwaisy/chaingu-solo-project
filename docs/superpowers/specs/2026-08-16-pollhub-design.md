# PollHub — Design Spec

Date: 2026-08-16
Target: Chingu Solo Project, Tier 3 (Fullstack)
Time budget: ~5 hours (MVP scope; more features may be added later)

## Purpose

A small fullstack group polling app. Logged-in users create polls with
multiple options, share them, and other logged-in users vote once per poll.
Results are shown live as percentage bars.

## Tier 3 fit

- Frontend and backend are separate applications with distinct responsibility
  (SRP): `/client` (React) and `/server` (Express).
- The database (MongoDB) is only ever accessed from the backend.
- The backend implements a custom REST API; the frontend only talks to that
  API, never to the database directly.
- Auth is app-specific (JWT + bcrypt, not an external auth-as-a-service), and
  it's coupled with the app's own API — not merely "auth only."
- The frontend contains original logic: percentage/result calculation,
  vote-state derivation (has this user voted?), protected routing.
- The backend implements full CRUD on polls (Create/Read/Delete; Update is
  out of scope for MVP — see Non-goals) plus a dedicated vote action.

## Architecture

- **Frontend**: React (Vite), React Router for pages, React Context for auth
  state, Axios instance with a request interceptor that attaches the JWT.
- **Backend**: Node.js + Express REST API. JWT auth middleware protects
  write routes. A centralized error-handling middleware returns consistent
  JSON error shapes.
- **Database**: MongoDB (Atlas free tier in production, local MongoDB in
  dev) accessed via Mongoose, backend-only.

## Data model

- `User`
  - `username: String, unique, required`
  - `email: String, unique, required`
  - `passwordHash: String, required`
- `Poll`
  - `question: String, required`
  - `options: [{ text: String }]` (2–6 options)
  - `createdBy: ObjectId ref User, required`
  - `createdAt: Date`
- `Vote`
  - `pollId: ObjectId ref Poll, required`
  - `userId: ObjectId ref User, required`
  - `optionIndex: Number, required`
  - Unique compound index on `(pollId, userId)` to enforce one vote per user
    per poll at the database level.

## API

All routes are prefixed `/api`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | none | Create a user account |
| POST | `/auth/login` | none | Return a JWT on valid credentials |
| GET | `/polls` | none | List all polls (question, option count, vote totals) |
| POST | `/polls` | required | Create a poll (2–6 options) |
| GET | `/polls/:id` | none | Get a poll with per-option vote counts |
| POST | `/polls/:id/vote` | required | Cast a vote; rejects a second vote from the same user |
| DELETE | `/polls/:id` | required, owner only | Delete a poll the requester created |

Error responses use a consistent shape: `{ error: { message, code } }`.

## Frontend

Pages:
- **Login / Register** — forms with client-side validation and server error
  display.
- **Poll list** — all polls, link into each.
- **Create Poll** — dynamic option inputs (add/remove, 2–6 range enforced).
- **Poll detail** — if the current user hasn't voted, shows a vote form; if
  they have (or after voting), shows results as percentage bars computed
  client-side from vote counts. Owner sees a delete control.

State/cross-cutting:
- `AuthContext` holds the current user + JWT (persisted in `localStorage`),
  exposes `login`, `register`, `logout`.
- Protected routes (`Create Poll`) redirect to `/login` if unauthenticated.
- Axios instance centralizes the base URL and JWT header injection.
- Per-request loading and error UI states (no unhandled promise states left
  blank/silent).

## Error handling

- Backend: every route wrapped in try/catch (or an async-handler wrapper);
  validation errors (missing fields, bad option count, duplicate
  username/email, double-vote attempt) return 4xx with a clear message;
  unexpected errors return 500 via the centralized error middleware.
- Frontend: failed requests surface an inline error message near the
  relevant form/action; network/auth failures (expired/invalid token) log
  the user out and redirect to login.

## Testing

Stretch goal if time remains within the 5-hour budget: a couple of
Vitest/React Testing Library tests for one non-trivial component (e.g. the
results percentage-bar calculation) and/or a supertest test for the vote
double-submit rejection. Not required for MVP completion.

## Deployment

Stretch goal: frontend to Vercel, backend to Render, database on MongoDB
Atlas. Documented as a follow-up, not blocking MVP completion within the
5-hour budget.

## Non-goals (MVP)

- Editing a poll's question/options after creation.
- Changing/retracting a vote after casting it.
- Poll expiration, visibility/privacy settings, or comments.
- Real-time (websocket) result updates — results refresh on page
  load/vote only.
- Password reset / email verification.

These are explicitly deferred; scope may be revisited after the MVP is
built, per the user's direction to "add things to scope next, not now."

## 5-hour time budget

1. Backend scaffold, models, auth (register/login, JWT, bcrypt) — 1.25h
2. Poll + vote endpoints, validation, error middleware — 1h
3. Frontend scaffold, auth pages, routing, AuthContext, Axios setup — 1h
4. Poll list/create/detail pages, voting UI, results bars — 1.25h
5. Error-handling polish, manual end-to-end pass, (stretch) deploy — 0.5h
