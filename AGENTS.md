# Agent instructions (Daniel OS Dashboard)

Use this file as the project briefing for AI assistants (Cursor, Claude Code, etc.). Keep changes factual and concise.

## Product

Next.js dashboard for operating agent-powered workflows: CRM (Closer), meetings (Scribe / Sybill), content (Creator / Scout), prep (Ghost), memory (Echo), routing (Chief of Staff), Slack monitoring (Pulse). Data lives in Postgres via Prisma; background work is intended to go through BullMQ + Redis.

## Repository map

| Path | Purpose |
|------|---------|
| `src/lib/agents.ts` | **Canonical agent registry** — `AGENT_DEFINITIONS` (slug, name, role, description, config). `prisma/seed.ts` upserts from here; edit agents here first. |
| `src/lib/db.ts` | Prisma singleton (`db`). |
| `src/lib/agent-config.ts` | Helpers to display `Agent.config` JSON in the UI. |
| `prisma/schema.prisma` | Models: Agent, AgentRun, Approval, CRM, meetings, content, research, alerts, integrations. |
| `src/app/(dashboard)/` | Dashboard pages (server components by default). |
| `src/app/api/` | Route handlers for triggers, approvals, webhooks, etc. |
| `src/components/` | Shared UI (sidebar, cards, actions). |

## Commands

- `npm run dev` — local app (default port **3040** via `${PORT:-3040}`; override: `PORT=<n> npm run dev`)
- `npm run lint`
- `npm run db:generate` — Prisma client → `src/generated/prisma`
- `npm run db:push` / `npm run db:migrate` — schema apply
- `npm run db:seed` — seed from `AGENT_DEFINITIONS` + sample data

Env: see `.env.example` and `README.md`. Production DB is **Supabase** project `hgtsozokxygzpubqbtjy` (`DATABASE_URL` points at `db.hgtsozokxygzpubqbtjy.supabase.co`).

## Implementation norms

- Match existing patterns: Tailwind utility classes, `Card` / `StatusBadge`, App Router layouts.
- Prefer typed boundaries at API routes (Zod) when the body is not trivial.
- Do not duplicate agent metadata outside `src/lib/agents.ts` unless syncing seed/UI — single source of truth is the definitions array.

## Next.js note

<!-- BEGIN:nextjs-agent-rules -->

This project uses a current Next.js major version; APIs and defaults may differ from older docs. Prefer `node_modules/next/dist/docs/` or official Next.js documentation when uncertain.

<!-- END:nextjs-agent-rules -->
