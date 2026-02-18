# Siesta

Sales Engineering pipeline management platform integrating Salesforce CRM and Gong for unified visibility into opportunities, calls, and activities.

## Tech Stack

- **Monorepo:** Turborepo with npm workspaces
- **Frontend (`apps/web`):** React 19, Vite 6, TanStack Router (file-based), TanStack Query, Tailwind CSS 4, TipTap editor
- **Backend (`apps/server`):** Fastify 5, Node.js 20+, TypeScript 5.7
- **Database:** PostgreSQL 16 with Drizzle ORM (extensions: pg_trgm, pgcrypto)
- **Queue/Cache:** BullMQ + Redis 7 via ioredis
- **Auth:** Google OAuth (openid-client) with dev-bypass mode
- **Shared (`packages/shared`):** Types, Zod validation schemas, role constants

## Commands

```bash
# Development
docker-compose up -d          # Start PostgreSQL + Redis
npm install
npm run dev                   # Start all apps (frontend :5173, backend :3000)

# Build & Typecheck
npm run build                 # Build all packages and apps
npm run typecheck              # Type-check all workspaces
npm run lint                   # Lint all workspaces

# Database (Drizzle)
npm run db:generate            # Generate migrations from schema
npm run db:migrate             # Run pending migrations
npm run db:studio              # Open Drizzle Studio GUI
```

## Project Structure

```
apps/
  server/src/
    routes/          # Fastify route handlers
    services/        # Business logic layer
    integrations/    # Salesforce and Gong API clients, sync, mappers
    jobs/            # BullMQ workers, schedulers (SF 15min, Gong 30min)
    db/schema/       # Drizzle table definitions and migrations
    auth/            # Auth plugin, guards, Google OAuth, sessions
    config/          # Zod-validated environment config
  web/src/
    pages/           # Route components (lazy loaded via TanStack Router)
    components/      # UI components (layout/, common/, feature-specific/)
    api/             # API client functions
    hooks/           # Custom React hooks
    contexts/        # AuthContext, ThemeContext
packages/
  shared/src/        # Shared types, Zod schemas, role constants
k8s/                 # Kubernetes deployment manifests
scripts/             # Database initialization scripts
```

## Architecture Notes

- **Backend pattern:** Routes -> Services -> Drizzle ORM. Fastify plugin architecture for modularity.
- **Frontend pattern:** File-based routing with lazy loading. TanStack Query for server state (2min stale time). Vite dev proxy forwards `/api` and `/auth` to backend.
- **User roles:** `se` (own opportunities), `se_manager` (all opportunities), `admin` (full access + settings). Level-based hierarchy in `packages/shared/src/constants/roles.ts`.
- **Token encryption:** Salesforce/Gong/Google OAuth tokens encrypted in DB via pgcrypto and a 32-byte ENCRYPTION_KEY.
- **Background jobs:** BullMQ workers for async Salesforce/Gong sync. Cron-scheduled via node-cron.
- **Production:** Single Docker container serves static frontend + API on port 3000. Kubernetes manifests in `k8s/`.
