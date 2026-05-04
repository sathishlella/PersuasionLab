<!-- AGENTS.md — Living documentation for AI coding agents working on PersuasionLab. -->

# PersuasionLab — AI Coding Agent Guide

## Project Overview

PersuasionLab is a full-stack academic research platform for AI behavioral studies. It runs real-time persuasion experiments where multiple AI models (GPT, Grok, Gemini) compete as sales consultants attempting to shift a user's phone preference (e.g., from iPhone to Samsung Galaxy S25 Ultra). The system tracks every message for persuasion techniques, detects conversion events, and generates research-grade analytics including model comparison, technique sequencing, and behavioral pattern analysis.

The project is a monorepo with a React frontend, Express backend, shared TypeScript types, and a MySQL database managed via Drizzle ORM.

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (Radix UI primitives), wouter (routing), TanStack Query, tRPC React Query client
- **Backend**: Express, tRPC v11 (with superjson transformer), Drizzle ORM, mysql2
- **AI/LLM**: OpenAI-compatible APIs via multiple providers (OpenAI, Groq, Google Gemini, Forge). A generic LLM client (`server/_core/llm.ts`) is used for secondary analysis calls.
- **Auth**: OAuth 2.0 via Manus platform, JWT session cookies (HS256) using `jose`
- **Build**: Vite bundles the client; esbuild bundles the server into `dist/`
- **Test**: Vitest (Node environment, server-side only)
- **Package Manager**: pnpm (required; patches applied to `wouter`)

## Project Structure

```
├── client/src/          # React frontend
│   ├── components/      # UI components (shadcn/ui + custom)
│   ├── components/ui/   # 50+ shadcn/ui primitives (button, dialog, form, etc.)
│   ├── pages/           # Route pages: Home, Chat, Analytics, NotFound, ComponentShowcase
│   ├── hooks/           # Custom React hooks (useComposition, useIsMobile, usePersistFn)
│   ├── lib/             # tRPC client, cn() utility
│   ├── contexts/        # ThemeContext (light/dark)
│   ├── _core/hooks/     # useAuth hook
│   ├── const.ts         # getLoginUrl() builder
│   ├── index.css        # Tailwind v4 theme variables
│   └── main.tsx / App.tsx
├── server/              # Express + tRPC backend
│   ├── _core/           # Core infrastructure
│   │   ├── index.ts     # Express server bootstrap
│   │   ├── trpc.ts      # tRPC router + procedure builders
│   │   ├── context.ts   # tRPC context (auth, req, res); falls back to guest user
│   │   ├── env.ts       # Environment variable aggregation
│   │   ├── oauth.ts     # OAuth callback route handler
│   │   ├── sdk.ts       # Manus OAuth SDK (token exchange, JWT sessions)
│   │   ├── llm.ts       # Generic LLM invocation client
│   │   ├── cookies.ts   # Session cookie option builder
│   │   ├── systemRouter.ts  # Health + admin notify endpoints
│   │   ├── vite.ts      # Vite dev server integration + static serving
│   │   ├── storageProxy.ts  # /manus-storage/* proxy
│   │   └── types/       # Manus platform type definitions
│   ├── routers.ts       # Main tRPC app router (auth, models, conversation, chat, analytics)
│   ├── ai-models.ts     # Model configs, persuasion prompt, invoke + analyze functions
│   ├── db.ts            # Drizzle ORM query helpers with in-memory fallback
│   └── *.test.ts        # Vitest unit tests
├── shared/              # Shared between client and server
│   ├── const.ts         # Cookie name, error messages, timeouts
│   ├── types.ts         # Re-exports drizzle schema types + errors
│   └── _core/errors.ts  # HttpError classes (400/401/403/404)
├── drizzle/             # Database schema and migrations
│   ├── schema.ts        # MySQL table definitions (users, conversations, messages, analyticsEvents, modelConfigs)
│   ├── relations.ts     # Empty (no Drizzle relational queries used)
│   └── migrations/      # SQL migration files
├── patches/             # pnpm patches (wouter)
└── dist/                # Build output (gitignored)
```

## Path Aliases

Configured in `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`:

- `@/` → `./client/src/*`
- `@shared/` → `./shared/*`
- `@assets/` → `./attached_assets`

## Build and Development Commands

All commands run via `pnpm`:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with Vite HMR + Express API (tsx watch) |
| `pnpm build` | Build client to `dist/public` and bundle server to `dist/index.js` |
| `pnpm start` | Run production server from `dist/index.js` |
| `pnpm check` | TypeScript type check (`tsc --noEmit`) |
| `pnpm format` | Format codebase with Prettier |
| `pnpm test` | Run Vitest test suite |
| `pnpm db:push` | Generate and run Drizzle migrations |

## Runtime Architecture

The Express server (`server/_core/index.ts`) bootstraps as follows:

1. Registers body parsers (50MB limit for uploads).
2. Registers storage proxy (`/manus-storage/*`) and OAuth callback (`/api/oauth/callback`).
3. Mounts tRPC API at `/api/trpc` via `createExpressMiddleware`.
4. In **development**: integrates Vite dev server (`setupVite`).
5. In **production**: serves static files from `dist/public` (`serveStatic`) with SPA fallback.
6. Finds an available port (default 3000, scans up to 3020).

The client entry (`client/src/main.tsx`) creates a tRPC React client with `httpBatchLink` to `/api/trpc`, `superjson` transformer, and credentials included. Unauthorized tRPC errors matching `UNAUTHED_ERR_MSG` redirect to the OAuth login URL.

## Authentication Flow

1. User clicks "Sign In" → redirected to Manus OAuth portal with `appId`, `redirectUri`, `state` (base64-encoded redirect URI).
2. OAuth server redirects back to `/api/oauth/callback?code=&state=`.
3. Server exchanges code for token, fetches user info, upserts user in DB, creates JWT session cookie (`app_session_id`).
4. Subsequent requests include the cookie; `sdk.authenticateRequest()` verifies JWT and loads user from DB.
5. `useAuth()` hook on the frontend queries `trpc.auth.me` and handles logout.

**Guest fallback**: If session authentication fails for any reason, `createContext` automatically falls back to `getOrCreateGuestUser()` (`openId = "__guest__"`) so protected routes always have a user context.

The user matching `OWNER_OPEN_ID` is automatically assigned the `admin` role on upsert.

## Database Schema

MySQL database managed by Drizzle ORM. **No foreign key constraints** are defined; referential integrity is handled at the application level. Key tables:

- **users** — `openId` (unique), name, email, role (`user`/`admin`), timestamps
- **conversations** — session-based chats linked to a user and AI model; tracks status, target product, final decision, persuasion success, messages to conversion
- **messages** — individual chat messages with persuasion technique, conversation phase, sentiment score, conversion event flag, metadata (JSON)
- **analyticsEvents** — event stream for research tracking (conversation started, completed, conversion detected)
- **modelConfigs** — per-model configuration (endpoint, model name, active status). Defined in schema but currently **not used** by app logic (configs live in `server/ai-models.ts`)

**In-memory fallback**: If `DATABASE_URL` is unset, `server/db.ts` falls back to in-memory arrays (`_memUsers`, `_memConversations`, etc.) with auto-incrementing IDs, allowing the app to run locally without MySQL.

## tRPC Router Structure

Defined in `server/routers.ts`:

- `system.health` — public health check
- `system.notifyOwner` — admin-only notification endpoint
- `auth.me` — returns current user (or guest)
- `auth.logout` — clears session cookie
- `models.list` — returns active AI models
- `conversation.create` — starts a new persuasion session (target product hardcoded to "Samsung Galaxy S25 Ultra")
- `conversation.get` — fetch conversation + messages by ID
- `conversation.list` — user's conversation history
- `conversation.complete` — mark session as completed with outcome
- `chat.send` — send user message, invoke AI model, analyze response technique
- `analytics.overview` — per-model stats (GPT, Grok, Gemini)
- `analytics.detailed` — all conversations + messages
- `analytics.techniques` — technique frequency breakdown
- `analytics.modelComparison` — side-by-side model metrics
- `analytics.techniqueSequencing` — technique transition patterns
- `analytics.behavioralPatterns` — winning/losing techniques, conversion speed, engagement

Procedure types:
- `publicProcedure` — no auth required
- `protectedProcedure` — requires authenticated user (or guest fallback)
- `adminProcedure` — requires authenticated user with `role === 'admin'`

## AI Model Integration

Models are configured in `server/ai-models.ts`:

| Model | Active | Endpoint | Model Name | API Key Source |
|-------|--------|----------|------------|----------------|
| **GPT** | ✅ | OpenAI if `OPENAI_API_KEY` set; else Groq | `gpt-4o-mini` or `openai/gpt-oss-120b` | `OPENAI_API_KEY` or `GROQ_API_KEY` |
| **Grok** | ✅ | Groq | `llama-3.3-70b-versatile` | `GROQ_API_KEY` |
| **Gemini** | ✅ | Google if `GOOGLE_API_KEY` set; else Groq | `gemini-2.0-flash` or `llama-3.1-8b-instant` | `GOOGLE_API_KEY` or `GROQ_API_KEY` |
| **Claude** | ❌ | Forge (`BUILT_IN_FORGE_API_URL`) | `claude-sonnet-4-20250514` | `BUILT_IN_FORGE_API_KEY` |

**Persuasion system prompt**: Based on Cialdini's 7 principles (reciprocity, commitment, social proof, authority, liking, scarcity, unity) with a 5-phase conversation framework mapped to message ranges:
1. **Rapport** (msgs 1–3)
2. **Discovery** (msgs 4–6)
3. **Seed Doubt** (msgs 7–10)
4. **Reframe** (msgs 11–15)
5. **Close** (msgs 16+)

**Technique analysis**: After each assistant response, a secondary LLM call (`analyzePersuasionTechnique` using `invokeLLM` from `server/_core/llm.ts`) analyzes the technique used, conversation phase, and whether a conversion event occurred. Possible techniques: `reciprocity`, `commitment`, `social_proof`, `authority`, `liking`, `scarcity`, `unity`, `reframing`, `anchoring`, `loss_aversion`, `future_pacing`, `none`.

**Mock mode**: If no API key is configured for a model, `invokeModel` returns a hardcoded mock response, enabling fully offline local development.

## Testing Strategy

- **Framework**: Vitest with Node environment
- **Config**: `vitest.config.ts` resolves the same path aliases as Vite
- **Test files**: `server/**/*.test.ts` and `server/**/*.spec.ts`
- **Approach**: Unit tests use `vi.mock()` to mock `ai-models` and `db` modules, then call tRPC procedures via `appRouter.createCaller(ctx)` with a mock authenticated context
- **Existing tests**:
  - `server/chat.test.ts` — covers `models.list`, `conversation.create`, `chat.send`, `conversation.complete`, `analytics.overview`, `analytics.techniques`
  - `server/auth.logout.test.ts` — verifies cookie clearing on logout
  - `server/grok.test.ts` — validates `GROK_API_KEY` env variable and x.ai endpoint reachability
- **No frontend tests** or CI/CD pipelines are currently present.

## Code Style Guidelines

- **Formatter**: Prettier (config in `.prettierrc`)
  - Semi: true, double quotes, trailing commas (es5), printWidth: 80, tabWidth: 2, LF line endings
- **TypeScript**: Strict mode enabled; `noEmit` for type checking only
- **Module system**: ESM (`"type": "module"`)
- **Imports**: Use path aliases (`@/components/ui/button`, `@shared/const`)
- **Naming**: PascalCase for components, camelCase for functions/variables, UPPER_SNAKE for constants
- **Error handling**: Use `HttpError` subclasses from `@shared/_core/errors` for expected failures; tRPC middleware throws `TRPCError` for auth errors

## Environment Variables

Required for runtime (should be in `.env`, never committed):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Secret for signing session JWTs |
| `VITE_APP_ID` | Manus OAuth app ID |
| `OAUTH_SERVER_URL` | Manus OAuth server base URL |
| `OWNER_OPEN_ID` | Admin user's openId |
| `BUILT_IN_FORGE_API_URL` | Forge API base URL |
| `BUILT_IN_FORGE_API_KEY` | Forge API key (used for Claude) |
| `GROK_API_KEY` | Groq API key (used for Grok model) |
| `OPENAI_API_KEY` | OpenAI API key (used for GPT model) |
| `GROQ_API_KEY` | Groq API key (fallback for GPT/Grok/Gemini) |
| `GOOGLE_API_KEY` | Google API key (used for Gemini model) |
| `VITE_OAUTH_PORTAL_URL` | Frontend OAuth portal URL |
| `PORT` | Server port (default 3000) |
| `NODE_ENV` | `development` or `production` |

## Security Considerations

- Session cookies are `httpOnly`, `path: "/"`, `sameSite: "none"`, and `secure` based on request protocol.
- JWT sessions use HS256 and expire after 1 year (`ONE_YEAR_MS`).
- The `OWNER_OPEN_ID` user is automatically granted admin privileges.
- Admin endpoints (`adminProcedure`) enforce role checks.
- API keys and secrets must never be logged or sent to the client.
- Vite dev server has `fs.strict: true` and denies dotfiles.

## Adding a New AI Model

To add a new model:

1. Add the model type to the `ModelType` union in `server/ai-models.ts`.
2. Add config entry to `getModelConfigs()` with endpoint, model name, and API key source.
3. Update any frontend model type references (e.g., `client/src/pages/Chat.tsx`).
4. Update analytics queries in `server/routers.ts` that hardcode model arrays (currently `["gpt", "grok", "gemini"]`).

## Common Development Tasks

- **Add a new tRPC endpoint**: Add it to `server/routers.ts` using `publicProcedure`, `protectedProcedure`, or `adminProcedure`. The frontend can immediately call it via the `trpc` hook with full type safety.
- **Add a DB table**: Define it in `drizzle/schema.ts`, add helper queries in `server/db.ts`, then run `pnpm db:push`.
- **Add a new page**: Create the component in `client/src/pages/`, add the route in `client/src/App.tsx`, and use `wouter`'s `Route` component.
- **Style a component**: Use Tailwind utility classes. The design system uses CSS variables for theming (light/dark mode supported via `ThemeContext`).
