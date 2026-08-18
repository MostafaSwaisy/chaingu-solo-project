# PollHub

PollHub is a simple online polling app. Anyone can browse and view polls;
registered users can create polls and vote; admins can manage users and
polls from a dedicated dashboard.

**Live site:** _add your Netlify URL here_

---

## Getting started

1. Open the site link above.
2. Click **Register** and create an account with a username, email, and
   password.
3. You're automatically logged in after registering (and after future
   logins) — your session stays active in the browser until you click
   **Log out**.

---

## Using PollHub as a regular user

### Browsing polls

- The home page lists all active polls. Click any poll to see its
  question, options, and current vote counts.
- You don't need an account to view polls, only to vote or create one.

### Voting

1. Open a poll and log in if you haven't already.
2. Select one option and submit your vote.
3. Each account can vote once per poll — voting again on the same poll is
   not allowed.
4. If a poll has an end time and it has passed, voting is closed but the
   results remain visible.

### Creating a poll

1. Log in, then click **Create Poll** in the top navigation.
2. Fill in:
   - **Question** — what you're asking.
   - **Options** — between 2 and 6 answer choices.
   - **Ends at** (optional) — a date/time after which voting closes
     automatically. Leave this blank for a poll that never expires.
3. Click **Create poll**. You'll be taken straight to the new poll's page,
   where you can share the link with others.

### Logging out

Click **Log out (your-username)** in the top navigation at any time.

---

## Using PollHub as an admin

Admin accounts see an **Admin** link in the navigation bar leading to a
dashboard with two panels: **Users** and **Polls**.

> Regular accounts are not admins by default. An account becomes an admin
> only if another admin creates it that way, or the account is promoted
> directly in the database — there is no self-service way to become an
> admin from the UI.

### Managing users

From the **Users** panel you can:

- **View** every registered user, including their username, email, and
  admin status.
- **Add a new user** directly (useful for creating another admin account
  without going through public registration).
- **Remove a user** — this deactivates the account (a "soft delete"); the
  account can no longer log in, but its historical votes and polls are
  preserved for record-keeping.

### Managing polls

From the **Polls** panel you can:

- **View** every poll on the platform, including who created it and
  whether it has ended.
- **End a poll immediately** — closes voting right away, even if it had a
  later scheduled end time or no end time at all.
- **Remove a poll** — this deactivates the poll (a "soft delete"); it's
  removed from the public poll list, but its data isn't destroyed.

---

## Notes

- The first request to the app after a period of inactivity may take
  30-50 seconds to respond — the backend runs on a free hosting tier that
  sleeps when idle and needs a moment to wake up.
- If something isn't working, check that you're logged in (many actions
  require an account) and that the poll you're trying to vote on hasn't
  already ended.
