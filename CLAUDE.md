# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PersuasionLab is a full-stack academic research platform where GPT, Grok, and Gemini compete as AI sales consultants in real-time persuasion experiments. Every message is tagged with a persuasion technique; conversion events are detected and fed into a research analytics dashboard.

See [AGENTS.md](AGENTS.md) for comprehensive architecture documentation.

## Commands

```bash
pnpm dev          # Start dev server (Vite HMR + Express via tsx watch)
pnpm build        # Build client to dist/public, server to dist/index.js
pnpm start        # Run production server
pnpm check        # TypeScript type check (no emit)
pnpm format       # Run Prettier
pnpm test         # Run Vitest (all server/**/*.test.ts)
pnpm db:push      # Generate + run Drizzle migrations
```

Run a single test file: `pnpm vitest run server/chat.test.ts`

## Architecture

**Monorepo**: `client/` (React + Vite), `server/` (Express + tRPC), `shared/` (types/constants), `drizzle/` (schema + migrations).

**Path aliases** (`@/` → `client/src/`, `@shared/` → `shared/`) must be kept in sync across `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`.

**tRPC**: The entire API surface lives in [server/routers.ts](server/routers.ts). Add new procedures there using `publicProcedure`, `protectedProcedure`, or `adminProcedure`. The frontend gets full type safety automatically via the `trpc` hook from [client/src/lib/trpc.ts](client/src/lib/trpc.ts).

**Database**: Drizzle ORM with MySQL. Schema is in [drizzle/schema.ts](drizzle/schema.ts); query helpers in [server/db.ts](server/db.ts). When `DATABASE_URL` is unset, the server falls back to in-memory stores — useful for local development without MySQL.

**AI models**: All model configs, the persuasion system prompt (Cialdini's 7 principles, 5-phase framework), and the `invokeModel` / `analyzePersuasionTechnique` functions live in [server/ai-models.ts](server/ai-models.ts). GPT, Gemini, and Claude go through the Forge API; Grok calls `api.x.ai` directly. Adding a model requires updating the `ModelType` union, `getModelConfigs()`, the Chat page, and any hardcoded model arrays in analytics queries.

**Auth**: Manus OAuth → JWT session cookie (`app_session_id`). The `useAuth()` hook queries `trpc.auth.me`; on `UNAUTHED_ERR_MSG` it redirects to the OAuth portal. The user matching `OWNER_OPEN_ID` is auto-promoted to `admin`.

## Testing

Tests mock `ai-models` and `db` with `vi.mock()`, then call tRPC procedures via `appRouter.createCaller(ctx)` with a synthetic auth context. Keep tests in `server/` co-located with the code they cover.

## Key Conventions

- ESM throughout (`"type": "module"`); use `import`, not `require`
- Prettier enforced: double quotes, semis, 80-char width, trailing commas (es5)
- Use `HttpError` subclasses from `@shared/_core/errors` for expected failures; tRPC auth errors use `TRPCError`
- API keys are server-side only — never reference them in `client/`
