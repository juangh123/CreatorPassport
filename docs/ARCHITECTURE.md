# CreatorPassport Architecture

## System Overview

CreatorPassport is a Next.js 16 App Router application backed by Supabase Postgres and the Minds agent platform.

```text
Browser
  |
  | Next.js App Router
  +----------------------+
  | Pages                |
  | /login /dashboard    |
  | /campaigns/new       |
  | /campaigns/[id]      |
  +----------+-----------+
             |
             v
  +----------------------+
  | Route Handlers       |
  | /api/campaigns       |
  | /api/campaigns/[id]  |
  | /api/.../generate    |
  | /api/.../versions    |
  | /api/creators/...    |
  +----------+-----------+
       |            |
       v            v
   Supabase      Minds SDK
   Postgres      (chatStreamText + memory)
```

## Request Flows

### Campaign Generation

1. The client POSTs `title`, `source_text`, `platforms`, and `sponsor_brief` to `/api/campaigns`.
2. The route authenticates with Supabase and inserts a `campaigns` row.
3. `generateCampaignContent` loads the creator's `voice_profile` and `mind_id`.
4. If a Minds agent is available, the service calls `getMindMemoryContext()` and injects it into the generation prompt.
5. For each selected platform, the service calls `sendMindMessage()`.
6. `sendMindMessage()` uses `mindsClient.agents.chatStreamText()` and reuses the campaign conversation ID after the first call.
7. Each generated version is compliance-checked and stored in `platform_versions`.
8. Generation failures create pending `follow_up_tasks` with type `incomplete_versions`.

### Edit and Memory Loop

1. The campaign detail page detects an edit and PATCHes `/api/campaigns/[id]/platform-versions/[versionId]`.
2. The route updates `platform_versions.final_text` and `status`.
3. The route inserts a `learning_events` row for the modification.
4. If the creator has a `mind_id`, the route writes a Minds memory fact with the original and edited text.
5. On a later generation, `getMindMemoryContext()` retrieves relevant memories and includes them under `Learned Preferences`.

## Key Components

- `src/minds/client.ts` — Minds SDK wrapper for generation, memory read, and memory write.
- `src/minds/prompts/index.ts` — CreatorPassport prompt templates.
- `src/lib/campaign-generation.ts` — orchestration between Supabase and Minds.
- `supabase/migrations/00000_init.sql` — canonical schema and RLS policies.

## Persistence Model

- Supabase stores application state: creators, campaigns, platform versions, learning events, and follow-up tasks.
- Minds stores agent-scoped facts for cross-session preference recall.
- Local edits are authoritative in Supabase; Minds memory is a preference layer for future generation.

## Security

- Supabase RLS scopes all campaign, version, learning-event, and follow-up data to the authenticated user.
- Minds credentials live only in server-side environment variables.
- `.env.local` is ignored and must not be committed.
