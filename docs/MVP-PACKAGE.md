# Daniel OS MVP Package

## Goal

Ship a private, Vercel-hosted business operating system that:

- runs Daniel's agents from one control center
- tracks sales, meetings, research, and content
- stores everything in a strong base database
- supports approvals before outbound actions

## MVP scope

### Included now

- React dashboard shell
- Postgres data model
- Prisma seed data
- business lane pages
- agent registry and run tracking
- approvals, alerts, schedules, integrations
- Sybill webhook entry point

### Next implementation phase

- real BullMQ workers
- real integration clients
- calendar-triggered Ghost briefs
- HighLevel sync
- Slack ingestion queue
- Telegram outbound notifications
- Echo retrieval pipeline

## Core product lanes

### Sales

- pipeline board
- hot leads
- stale deals
- follow-up approvals

### Meetings

- transcript intake
- Scribe summaries
- follow-up queue
- meeting action tracking

### Content

- Scout opportunities
- Creator briefs
- scripts and publishing workflow

### Research

- Ghost prospect briefs
- competitor scans
- industry reports

### Memory

- Echo source chunks
- calibration coverage
- uncertainty-first answers

## Recommended deployment architecture

- frontend + API: Vercel
- database: Neon Postgres
- queue/cache: Upstash Redis
- storage: Vercel Blob or S3 later
- errors: Sentry later

## GitHub push checklist

- ensure `.env` is not committed
- commit `.env.example`
- commit Prisma schema and seed
- commit README and docs
- connect repo to Vercel

## First real integrations to wire

1. Telegram
2. Slack
3. HighLevel
4. Google Workspace
5. Sybill
6. Apify
7. Brave
8. OpenAI embeddings
