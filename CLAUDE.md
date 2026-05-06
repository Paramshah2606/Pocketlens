# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (Next.js config)
```

There is no test suite configured.

## Environment Variables

Required in `.env.local`:
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — Secret for signing JWTs
- `EMAIL_USER` — Gmail address for OTP emails (optional; mocked if absent)
- `EMAIL_PASS` — Gmail app password

## Architecture

**PocketLens** is a personal expense tracker. Stack: Next.js 16 App Router, MongoDB/Mongoose, JWT auth, Redux Toolkit, Tailwind CSS v4.

### Route Structure

- `src/app/(auth)/` — Unauthenticated pages: login, signup, verify (OTP), forgot-password, reset-password
- `src/app/(dashboard)/` — Authenticated pages: dashboard, expenses, budgets, settings; shares a sidebar/nav layout (`layout.jsx`)
- `src/app/api/` — API routes grouped by resource: `auth/*`, `expenses/`, `expenses/[id]`, `budgets/`, `categories/`, `users/profile`, `insights/summary`, `seed/`

### Middleware / Auth

Middleware lives in **`src/proxy.js`** (not the standard `middleware.js`). It runs on the Edge Runtime and uses `jose` (not `jsonwebtoken`) for JWT verification — `jsonwebtoken` requires Node.js crypto which is unavailable in Edge.

Auth flow:
1. JWT is stored in an httpOnly cookie named `token` (7-day expiry).
2. The proxy verifies the cookie on every request, redirects unauthenticated users to `/login`, and injects the `x-user-id` header for downstream API routes.
3. API routes read the authenticated user via `req.headers.get('x-user-id')` — there is no `req.user` or session object.
4. Server-side signing/verifying (non-Edge) uses `src/lib/jwt.js` with `jsonwebtoken`.

Signup requires email OTP verification via `nodemailer` before login is permitted.

### Data Layer

- `src/lib/db.js` — Mongoose connection with global caching (`global.mongoose`) to survive hot reloads in dev.
- Models: `User`, `Expense`, `Budget`, `Category`, `Notification` in `src/models/`.
- `Category` has embedded `subCategories`. Expenses reference both `categoryId` and `subCategoryId`.

### State Management

Redux (via `src/store/`) is used **only for UI state** — the single `uiSlice` tracks whether the Add/Edit Expense modal is open and which expense is being edited, plus a `refreshTrigger` counter to signal list re-fetches. Server data is fetched directly in components via `fetch`.

### Key Conventions

- Path alias `@` maps to `src/`.
- `"use client"` is required on any component using hooks or browser APIs; layout/page files are Server Components by default.
- UI primitives (Button, Input, Card, Label) are in `src/components/ui/` using `clsx` + `tailwind-merge`.
- The dashboard layout (`src/app/(dashboard)/layout.jsx`) renders both a desktop sidebar and a mobile bottom nav bar; the FAB dispatches `openAddExpenseModal` to Redux.
