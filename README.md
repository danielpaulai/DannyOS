# Daniel OS Dashboard

React and Next.js command center for running Daniel's agent-powered business system across sales, meetings, content, research, and internal memory.

## Stack

- Next.js 16 + React 19
- Prisma + Postgres
- BullMQ + Redis
- Tailwind CSS 4
- Vercel-ready app router project

## What is included

- Executive dashboard overview
- Agent status board
- Approval inbox
- Run history
- Schedules and alerts
- Integrations status page
- Sales control room
- Meetings hub
- Content engine
- Research desk
- Memory console for Echo

## Database: Supabase (recommended)

This repo targets **Supabase Postgres** for production.

- **Project dashboard:** [Supabase — `hgtsozokxygzpubqbtjy`](https://supabase.com/dashboard/project/hgtsozokxygzpubqbtjy)
- **API URL:** `https://hgtsozokxygzpubqbtjy.supabase.co`

1. Copy [`.env.example`](./.env.example) to `.env`.
2. In Supabase → **Project Settings → Database**, copy the **URI** (direct connection) and replace `YOUR_DB_PASSWORD` in `DATABASE_URL`.
3. Run:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

If the dashboard returns HTTP 500, the app usually cannot reach Postgres — double-check `DATABASE_URL` and that the password is correct.

### Local Postgres (optional)

You need a **running Postgres** that matches `DATABASE_URL` in `.env`. If you prefer Docker instead of Supabase for local dev:

```bash
docker compose up -d
```

Then set in `.env`:

```bash
DATABASE_URL="postgresql://dashboard:dashboard@localhost:5432/dashboard"
```

Run `npm run db:push` and `npm run db:seed` once.

1. Install dependencies:

```bash
npm install
```

2. Copy env vars:

```bash
cp .env.example .env
```

3. Set a Postgres database and Redis instance in `.env`.

4. Generate Prisma client:

```bash
npm run db:generate
```

5. Push the schema:

```bash
npm run db:push
```

6. Seed the database:

```bash
npm run db:seed
```

7. Start the app:

```bash
npm run dev
```

The app listens on **port 3040** by default (so it does not clash with other apps on 3000). Open [http://localhost:3040](http://localhost:3040).

Use a different port by setting **`PORT`** before the script, for example: `PORT=3005 npm run dev` or `PORT=3005 npm run start`.

## Developing with Cursor

- Project brief for AI assistants: [`AGENTS.md`](./AGENTS.md) (repository map, commands, conventions).
- Editor rules: [`.cursor/rules/`](./.cursor/rules/) — always-on stack context plus API-route hints when you work under `src/app/api/`.
- Register or change agents in [`src/lib/agents.ts`](./src/lib/agents.ts), then re-seed or rely on upsert logic as appropriate.

## Core environment variables

- `DATABASE_URL`
- `REDIS_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`
- `HIGHLEVEL_API_KEY`
- `GHL_LOCATION_ID`
- `GHL_PIPELINE_ID`
- `GOOGLE_WORKSPACE_ACCOUNT`
- `OPENAI_API_KEY`
- `BRAVE_API_KEY`
- `APIFY_API_TOKEN`
- `SYBILL_WEBHOOK_SECRET`

## Vercel deploy

1. Push this repo to GitHub (e.g. [`danielpaulai/DannyOS`](https://github.com/danielpaulai/DannyOS)).
2. Import the repo in Vercel.
3. Add environment variables (at minimum `DATABASE_URL` from Supabase; use the **direct** or **pooled** URI per Vercel/Prisma guidance).
4. Add `REDIS_URL` (e.g. [Upstash](https://upstash.com/) Redis) for BullMQ when you wire workers.
5. Run `npm run db:push` and `npm run db:seed` against the Supabase database from your machine (with production `DATABASE_URL` in `.env` locally), or run migrations in CI — however you prefer to manage schema.

Recommended production services:

- Vercel for the app
- Supabase Postgres (this project’s default)
- Upstash Redis

## Database commands

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## Recommended next build steps

1. Replace seed data with real business records.
2. Wire in Telegram, Slack, and HighLevel first.
3. Add job workers for BullMQ instead of simulated runs.
4. Add auth and role controls before sharing with a team.
5. Add source citations and confidence UI for Ghost and Echo.
