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
   Supabase      Minds Builder API
   Postgres      (sendMessage + waitForReply)
```

## Request Flows

### Campaign Generation

1. The client POSTs `title`, `source_text`, `platforms`, and `sponsor_brief` to `/api/campaigns`.
2. The route authenticates with Supabase and inserts a `campaigns` row.
3. `generateCampaignContent` loads the creator's `voice_profile` and `mind_id`.
4. If a Minds agent is available, the service calls `getMindMemoryContext()` and injects it into the generation prompt.
5. For each selected platform, the service calls `sendMindMessage()`.
6. `sendMindMessage()` ensures a stable conversation alias, sends the prompt, and waits for the Mind reply.
7. The same alias is reused for every platform and later sessions through `campaigns.mind_session_id`.
8. Each generated version is compliance-checked and stored in `platform_versions`.
9. Generation failures create pending `follow_up_tasks` with type `incomplete_versions`.

### Edit and Memory Loop

1. The campaign detail page detects an edit and PATCHes `/api/campaigns/[id]/platform-versions/[versionId]`.
2. The route updates `platform_versions.final_text` and `status`.
3. The route inserts a `learning_events` row for the modification.
4. If the creator has a `mind_id`, the route sends a preference note into the persistent Minds conversation.
5. On a later generation, `getMindMemoryContext()` reads recent Mind replies from that conversation and includes them under `Learned Preferences`.

## Key Components

- `src/minds/client.ts` — Minds Builder API wrapper for generation, reply history, and memory writes.
- `src/minds/prompts/index.ts` — CreatorPassport prompt templates.
- `src/lib/campaign-generation.ts` — orchestration between Supabase and Minds.
- `supabase/migrations/00000_init.sql` — canonical schema and RLS policies.

## Persistence Model

- Supabase stores application state: creators, campaigns, platform versions, learning events, and follow-up tasks.
- Minds stores cross-session context inside the stable conversation alias; recent replies are used for preference recall.
- Local edits are authoritative in Supabase; the Minds conversation is a preference and continuity layer for future generation.

## Security

- Supabase RLS scopes all campaign, version, learning-event, and follow-up data to the authenticated user.
- Minds credentials live only in server-side environment variables.
- `.env.local` is ignored and must not be committed.
