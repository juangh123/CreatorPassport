# Judging Criteria Mapping

## Minds Integration Depth

- Uses `@minds/sdk` for real generation via `chatStreamText()`.
- Reuses the Minds conversation ID within a campaign for continuity across platform generations.
- Writes edited outputs as Minds memory facts and reads memory context during future generation.
- Creates pending follow-up tasks when a platform generation fails.
- Binding a per-creator agent ID is a first-class dashboard action.

## Creator-Economy Problem Fit

- Focuses on content repurposing across X, LinkedIn, Instagram, YouTube, and TikTok.
- Preserves creator voice while respecting sponsor required and forbidden terms.
- Reduces manual cross-platform reformatting work.

## Innovation & Creativity

- Treats creator edits as persistent preference signals rather than one-off corrections.
- Combines Supabase Realtime with a cross-session Minds memory loop.

## Execution & Completeness

- End-to-end flow: authentication, agent binding, campaign creation, generation, review, editing, and memory persistence.
- Database migration, RLS policies, unit tests, lint, typecheck, and production build are included.

## Viability & Scalability

- Server-side API routes keep Minds credentials private.
- Supabase RLS scopes every user to their own data.
- The generation and memory layers are separated from UI components for future background-queue and multi-agent work.
