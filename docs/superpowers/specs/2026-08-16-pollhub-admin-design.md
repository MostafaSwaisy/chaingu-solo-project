# PollHub — Admin Dashboard, Poll Expiry, Soft Delete

Date: 2026-08-16

## Scope

- Polls can get an optional expiry time; once past, voting is rejected.
- An admin role that can view all users/polls, end a poll immediately,
  create/soft-delete users, and soft-delete polls.
- Soft delete (not hard delete) for users and polls — records stay in the
  DB with a `deletedAt` timestamp, excluded from normal queries.

## Data model changes

- `User`: add `isAdmin: Boolean (default false)`, `deletedAt: Date (default null)`.
- `Poll`: add `expiresAt: Date (default null)`, `deletedAt: Date (default null)`.
  A poll is "ended" when `expiresAt` is set and `<= now`. Admin's "end
  immediately" just sets `expiresAt` to now — one mechanism covers both
  a scheduled expiry and a manual end.

## Behavior changes to existing endpoints

- `loginUser`: excludes users with `deletedAt` set (soft-deleted accounts
  can't log in).
- `createPoll`: accepts optional `expiresAt`; rejects a past timestamp.
- `getPoll` / `listPolls`: exclude polls with `deletedAt` set; response
  includes `expiresAt` and a derived `isEnded` boolean.
- `castVote`: rejects with 403 `POLL_ENDED` if the poll is ended; rejects
  with 404 if the poll is soft-deleted (same as not existing).
- `deletePoll` (existing owner-only endpoint): becomes a soft delete
  instead of a hard delete. Externally unchanged (still 204, still
  disappears from listings).

## New admin API (`/api/admin`, requires `requireAuth` + `requireAdmin`)

| Method | Route | Description |
|---|---|---|
| GET | `/admin/users` | List all users (including soft-deleted), with `isAdmin`/`deletedAt`/`createdAt` |
| POST | `/admin/users` | Create a user (optionally `isAdmin: true`) |
| DELETE | `/admin/users/:id` | Soft-delete a user |
| GET | `/admin/polls` | List all polls (including ended/soft-deleted), with `createdAt`/`expiresAt`/`deletedAt` |
| POST | `/admin/polls/:id/end` | Set `expiresAt` to now |
| DELETE | `/admin/polls/:id` | Soft-delete a poll |

`requireAdmin` middleware runs after `requireAuth`, loads the user, and
403s with `FORBIDDEN` if not an admin (or soft-deleted).

## Frontend changes

- `CreatePoll`: optional "Ends at" datetime field.
- `PollDetail`: when a poll `isEnded`, always show results (never the
  vote form) with an "This poll has ended" note, regardless of whether
  the viewer voted.
- Nav shows an "Admin" link when `user.isAdmin`.
- New `/admin` route, gated by an `AdminRoute` component (same pattern as
  `ProtectedRoute`, redirects non-admins to `/`).
- `AdminDashboard` page composes `AdminUsers` and `AdminPolls` — each
  fetches and renders its own table plus the relevant actions (create/
  delete user; end/delete poll).

## Admin bootstrap

No public "become admin" flow. The first admin is granted by directly
setting `isAdmin: true` on a user document in the dev database (done for
the existing seeded `alice` account as part of this change). Further
admins are created by an existing admin through the panel.

## Non-goals

- No restore-from-soft-delete UI.
- No audit log of admin actions.
- No editing of poll questions/options (unchanged from the MVP).
