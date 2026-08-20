# PollHub

PollHub is a full-stack polling application. Anyone can browse and view
polls; registered users can create polls and vote; admins can manage users
and polls from a dedicated dashboard.

**Live site:** _add your Netlify URL here_
**Live API:** _add your Render URL here_

---

## Table of contents

- [Description](#description)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Running the tests](#running-the-tests)
- [Usage](#usage)
- [Deployment](#deployment)
- [Reflection](#reflection)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Description

PollHub lets anyone view active polls without an account. Registered users
can create polls with 2-6 options and an optional expiry time, and vote once
per poll. Admins get a dashboard to manage user accounts and moderate polls
platform-wide.

## Screenshots

TODO: add screenshots or a short GIF of the home page, poll page, and admin
dashboard here.

## Tech stack

**Client** (`client/`)

- React 18 + Vite
- React Router
- Axios
- Vitest + React Testing Library

**Server** (`server/`)

- Node.js + Express
- MongoDB + Mongoose
- JSON Web Tokens (`jsonwebtoken`) for auth
- bcryptjs for password hashing
- Vitest + Supertest

**Deployment**

- Client: Netlify (`netlify.toml`)
- Server: Render (`render.yaml`)

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A running MongoDB instance (local or a hosted service such as MongoDB
  Atlas)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/MostafaSwaisy/chaingu-solo-project.git
   cd chaingu-solo-project
   ```

2. Install server dependencies and configure its environment:

   ```bash
   cd server
   npm install
   cp .env.example .env
   ```

   Set the values in `server/.env`:

   | Variable          | Description                          |
   | ----------------- | ------------------------------------ |
   | `PORT`            | Port the API listens on              |
   | `MONGODB_URI`     | Connection string for MongoDB        |
   | `JWT_SECRET`      | Secret used to sign auth tokens      |
   | `JWT_EXPIRES_IN`  | Auth token lifetime (e.g. `7d`)      |

3. Install client dependencies and configure its environment:

   ```bash
   cd ../client
   npm install
   cp .env.example .env
   ```

   Set the value in `client/.env`:

   | Variable       | Description                          |
   | -------------- | ------------------------------------ |
   | `VITE_API_URL` | Base URL of the running API          |

4. Run both apps in development (in separate terminals):

   ```bash
   # from server/
   npm run dev

   # from client/
   npm run dev
   ```

5. Open the URL Vite prints (typically `http://localhost:5173`).

## Running the tests

```bash
# from server/
npm test

# from client/
npm test
```

---

## Usage

### As a regular user

1. Click **Register** and create an account with a username, email, and
   password. You're logged in automatically after registering.
2. **Browse polls** on the home page — no account needed to view them.
3. **Vote**: open a poll, select an option, and submit. Each account can
   vote once per poll; if a poll's end time has passed, voting is closed but
   results stay visible.
4. **Create a poll**: click **Create Poll**, fill in a question, 2-6
   options, and an optional expiry time, then submit.
5. Click **Log out (your-username)** in the navigation to end your session.

### As an admin

Admin accounts see an **Admin** link leading to a dashboard with two
panels. Regular accounts are not admins by default — an account becomes an
admin only if another admin creates it that way, or it's promoted directly
in the database.

- **Users panel** — view all registered users, add a new user, or remove
  (deactivate) one. Deactivated accounts can't log in, but their historical
  votes and polls are preserved.
- **Polls panel** — view every poll, end one immediately regardless of its
  scheduled expiry, or remove (deactivate) one. Deactivated polls drop off
  the public list without destroying their data.

> The first request to the deployed app after a period of inactivity may
> take 30-50 seconds — the backend runs on a free hosting tier that sleeps
> when idle.

## Deployment

The client deploys to Netlify from `client/` (see `netlify.toml`); the
server deploys to Render from `server/` (see `render.yaml`). Set the
`MONGODB_URI` and `JWT_SECRET` environment variables in the Render
dashboard, and `VITE_API_URL` (pointing at the deployed API) in Netlify.

## Reflection

This project was built solo as a full-stack exercise in designing and
shipping a small application end to end: REST API design, JWT
authentication, MongoDB data modeling, and a React front end consuming
that API, developed test-first throughout.

## Contributing

This is a solo learning project and isn't actively seeking contributions,
but issues and suggestions are welcome. To propose a change:

1. Fork the repository and create a feature branch.
2. Make your change with tests covering the new behavior.
3. Open a pull request describing what changed and why.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

Mostafa Swaisy — [GitHub](https://github.com/MostafaSwaisy)
