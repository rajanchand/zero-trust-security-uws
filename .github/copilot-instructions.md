## Quick orientation for AI coding agents

This repository is a Vite + React + TypeScript app with a demo "zero-trust" auth flow and a MongoDB backend via an Express proxy. Below are the essential facts, conventions, and exact file examples an agent should use to be productive immediately.

- Architecture & big picture
  - Frontend: React + TypeScript built with Vite. Source lives under `src/`. The `@` alias maps to `./src` (see `vite.config.ts`).
  - Auth & business logic: demo auth + zero-trust logic is implemented in `src/contexts/AuthContext.tsx`, `src/lib/demo-data.ts`, and `src/lib/zero-trust.ts`. Read `AuthProvider` to understand session handling, OTP flow, device posture and policy decisions.
  - Database: MongoDB is the sole database. The frontend calls a Node/Express proxy at `proxy-server/index.js` which forwards queries to MongoDB. The client helper is at `src/lib/mongodb.ts`.
  - Docker stack: `docker-compose.yml` runs three services — `frontend` (nginx), `proxy-server` (Express), and `mongo` (MongoDB 7). Nginx reverse-proxies `/api/*` to the proxy-server.

- Developer workflows & important commands
  - Local dev: `npm install` then `npm run dev` (Vite dev server on port 8080).
  - Docker: `docker compose up --build -d` starts frontend (`:8080`), proxy-server (`:3000` internal), and MongoDB (`:27017`).
  - Build & preview: `npm run build` and `npm run preview`.
  - Tests: `npm test` runs `vitest run`; `npm run test:watch` runs `vitest` in watch mode. Test setup file: `src/test/setup.ts`.
  - Linting: `npm run lint` runs eslint across the repo.
  - Mongo proxy standalone: `cd proxy-server && PROXY_SECRET=secret MONGODB_URI="mongodb://localhost:27017" node index.js`.

- Project-specific conventions & patterns
  - Session & auth storage: the demo auth stores sessions and OTPs in browser `localStorage` and shows OTPs via toast notifications on screen. Many components depend on `localStorage` keys like `zt_session`.
  - Zero-trust policy: policy decisions are centrally computed by `src/lib/zero-trust.ts` and then logged via `addAuditLog` in demo-data. When adjusting login flows, preserve the audit logging calls found in `AuthContext.tsx`.
  - UI components follow the shadcn-style structure under `src/components/ui/*` (small, composable primitives). Use existing components rather than creating global CSS overrides.
  - Aliases: import paths commonly use `@/` (maps to `src`) — keep that style for consistency.

- Integrations & env variables
  - Frontend: `VITE_MONGO_PROXY_URL` (default `/api` in Docker), `VITE_MONGO_PROXY_SECRET` (default `secret`).
  - Proxy server: `MONGODB_URI`, `PROXY_SECRET` (optional header check), `PORT` (default 3000).

- Debugging tips and quick examples
  - OTP codes appear as toast notifications on screen during registration/login flows — no need to open browser console.
  - To reproduce device approval flows: after successful OTP verification `AuthContext` creates a device object (see `getDeviceFingerprint()` usage). Admin UI pages interact with device approval via the same in-memory/demo storage (`src/lib/demo-data.ts`).
  - Test MongoDB connection: `curl -s -X POST http://localhost:8080/api/query -H "Content-Type: application/json" -H "x-proxy-secret: secret" -d '{"action":"find","collection":"test"}'`

- Files to read first
  - `src/contexts/AuthContext.tsx` — core demo auth, OTP, zero-trust checks, audit logging
  - `src/lib/mongodb.ts` — MongoDB client helper (calls proxy)
  - `src/lib/demo-data.ts` and `src/lib/zero-trust.ts` — data model and policy logic
  - `proxy-server/index.js` — Express proxy that forwards queries to MongoDB
  - `docker-compose.yml` — full stack setup (frontend + proxy + MongoDB)
  - `vite.config.ts` — alias and dev server settings
