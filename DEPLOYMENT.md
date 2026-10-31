# PHANTOM STRIKE — CI/CD & Deployment Documentation

This repository houses **PHANTOM STRIKE**, a high-octane real-time multiplayer browser game built with **Next.js 16 App Router**, **Node.js/Express**, and **Socket.IO**, orchestrated as an **npm workspaces monorepo**.

---

## 1. Monorepo Architecture

```
phantom-strike/
├── package.json               # Root monorepo workspace configuration
├── package-lock.json
├── DEPLOYMENT.md              # Deployment guide & CI/CD architecture
├── shared/                    # Shared TypeScript models & game rules (@phantom-strike/shared)
│   ├── package.json
│   ├── types.ts
│   └── rules.ts
├── backend/                   # Real-time WebSocket game server (Railway)
│   ├── package.json
│   ├── tsconfig.json
│   ├── railway.json           # Railway deployment descriptor
│   └── src/
│       ├── index.ts           # Server entry point + healthcheck
│       ├── test-multiplayer.ts# 12-scenario integration test suite
│       └── ...
├── frontend/                  # Next.js 16 Web Application (Vercel)
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── vercel.json            # Vercel deployment descriptor
│   ├── scripts/test.mjs       # Static assets and type test suite
│   └── app/
└── .github/
    └── workflows/
        ├── ci.yml             # Pull Request & branch quality gate
        └── deploy.yml         # Independent CD for Vercel & Railway
```

---

## 2. Workspaces & Unified Scripts

The monorepo uses native npm workspaces (`workspaces: ["shared", "backend", "frontend"]`).

| Command | Action |
|---------|--------|
| `npm run lint` | Runs ESLint flat config across workspaces |
| `npm run type-check` | Runs `tsc --noEmit` across backend and frontend |
| `npm run test` | Runs all backend and frontend test suites |
| `npm run test:backend` | Executes 12-scenario multiplayer integration test suite |
| `npm run test:frontend` | Tests avatar assets, shared models, and CSS bundle |
| `npm run build` | Builds backend TypeScript to `dist/` and frontend Next.js production build |
| `npm run build:backend` | Compiles backend with `tsc` |
| `npm run build:frontend`| Produces optimized Next.js 16 production build |
| `npm run dev:backend` | Starts backend development server on port 3001 |
| `npm run dev:frontend` | Starts frontend Turbopack development server on port 3000 |

---

## 3. GitHub Actions CI/CD Pipeline

### A. Quality Gate (`.github/workflows/ci.yml`)
- **Triggers**:
  - `pull_request` targeting `main` or `master`
  - `push` to `main`, `master`, `feat/**`, `fix/**`
- **Execution Flow**:
  1. Monorepo dependency installation with `npm ci`
  2. ESLint code standard verification (`npm run lint`)
  3. Strict TypeScript type check across all workspaces (`npm run type-check`)
  4. Backend integration tests with automated server spin-up and teardown (`npm run test:backend`)
  5. Frontend asset integrity & component tests (`npm run test:frontend`)
  6. Backend and frontend production builds (`npm run build`)
- **Enforcement**: Any failure immediately blocks PR merging.

### B. Independent Continuous Deployment (`.github/workflows/deploy.yml`)
- **Triggers**:
  - `push` to `main`
  - Manual trigger via `workflow_dispatch` with target selection (`all`, `frontend`, `backend`)
- **Path-Based Change Detection**:
  - Uses `dorny/paths-filter@v3` to determine whether frontend, backend, or both changed.
  - Ensures frontend and backend deploy **independently** without unnecessary rebuilds.
- **Safety Gate**: Runs all checks (`quality-gate`) prior to executing deployment steps.

---

## 4. Required GitHub Secrets

Configure these repository secrets under **Settings > Secrets and variables > Actions**:

| Secret Name | Hosting Target | Purpose |
|-------------|----------------|---------|
| `VERCEL_TOKEN` | Vercel (Frontend) | Vercel API token for deployment automation |
| `VERCEL_ORG_ID` | Vercel (Frontend) | Vercel Team / Account ID (`vercel link`) |
| `VERCEL_PROJECT_ID` | Vercel (Frontend) | Vercel Project ID (`vercel link`) |
| `RAILWAY_TOKEN` | Railway (Backend) | Railway project token for service deployment |
| `RAILWAY_SERVICE` | Railway (Backend) | Service name in Railway (e.g. `phantom-strike-backend`) |

> **Security Note:** Secrets are injected only at execution time via environment variables and never logged or exposed in client bundles.

---

## 5. Deployment Setup Guide

### Vercel Deployment (Frontend)
1. In Vercel, create a new project and connect the GitHub repository.
2. Set **Root Directory** to `frontend` or monorepo root.
3. Configure Environment Variables in Vercel:
   - `NEXT_PUBLIC_SOCKET_URL`: Production URL of your Railway backend (e.g. `https://phantom-strike-production.up.railway.app`).
4. Generate deployment credentials:
   - Run `npx vercel link` to obtain `projectId` and `orgId` from `.vercel/project.json`.
   - Create a Personal Access Token in your Vercel account settings.
   - Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` to GitHub Secrets.

### Railway Deployment (Backend)
1. In Railway, create a new project and link the repository or deploy from CLI.
2. Set the service root directory to `backend` (or use root with `railway.json`).
3. Set Environment Variables in Railway:
   - `PORT`: `3001` (or let Railway assign automatically via `$PORT`)
   - `CLIENT_URL`: Comma-separated list of allowed origins, e.g. `https://phantom-strike.vercel.app,http://localhost:3000`
4. Generate deployment credentials:
   - Under Railway **Project Settings > Tokens**, create a Project Token.
   - Add `RAILWAY_TOKEN` and `RAILWAY_SERVICE` to GitHub Secrets.
5. Railway uses the included `backend/railway.json` for healthcheck probing at `/health`.

---

## 6. Local Quality Verification Checklist

To verify all quality checks locally before pushing to GitHub:

```bash
# 1. Clean monorepo dependencies
npm ci

# 2. Linting (Zero errors, zero warnings)
npm run lint

# 3. TypeScript Type-Check
npm run type-check

# 4. Multiplayer Integration Test Suite
npm run test:backend

# 5. Frontend Asset & Model Test Suite
npm run test:frontend

# 6. Production Builds
npm run build
```

