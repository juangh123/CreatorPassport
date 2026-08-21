# CreatorPassport

> **Minds Agent for Global Content Creators**
> Developed for Creative Minds Jam #1: Hong Kong — Content Repurposing Across Platforms

CreatorPassport is an autonomous creator-workflow agent that turns a long-form source idea into platform-native content for X, LinkedIn, Instagram, YouTube, and TikTok while preserving persona consistency and sponsor-compliance guardrails.

## Status

Working prototype with real Supabase and Minds integration:

- Next.js 16 App Router app builds successfully.
- Supabase authentication, campaign creation, generation, editing, and RLS are wired.
- Dashboard, onboarding, campaign creation, and campaign detail flows are implemented.
- Minds generation uses `chatStreamText()` and does not silently fall back to mock content.
- Edited outputs are persisted to Supabase and written to Minds memory, then injected into future generations.

## Features

- **Multi-platform generation** for X, LinkedIn, Instagram, YouTube, and TikTok.
- **Content repurposing workflow** from one long-form source into platform-specific versions.
- **Sponsor compliance guardrails** for required and forbidden terms.
- **Minds memory loop** across sessions: user edits become preference facts and influence future prompts.
- **Supabase Realtime** updates on campaign detail pages.
- **RLS-enabled Postgres schema** scoped to the authenticated user.

## Architecture

- **Frontend**: Next.js 16 App Router, React 19, Tailwind CSS, Framer Motion
- **Agent Layer**: `@minds/sdk`
- **Database**: Supabase Postgres + RLS
- **UI style**: neo-brutalism / hacker aesthetic

See `docs/ARCHITECTURE.md` for the data flow and component map.

## Getting Started

### Prerequisites

- Node.js >= 18
- Supabase project
- Minds API key
- A Minds agent ID, either from the dashboard or set as `MINDS_AGENT_ID`

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   On macOS/Linux:

   ```bash
   cp .env.example .env.local
   ```

   Fill in:

   ```bash
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   MINDS_API_KEY=...
   MINDS_AGENT_ID=...
   ```

3. **Apply the database migration**

   Apply `supabase/migrations/00000_init.sql` to your Supabase project.

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev         # start development server
npm run build       # production build
npm run start       # start production server
npm run lint        # ESLint
npm run lint:fix    # ESLint with auto-fix
npm run typecheck   # TypeScript
npm run test        # node --test
npm run preflight   # read-only env + Supabase + Minds checks
npm run check       # lint + typecheck + test + build
```

## Demo Flow

1. Open the Dashboard at `/dashboard` and bind your Minds agent ID.
2. Create a new campaign with long-form source text, sponsor constraints, and multiple platforms.
3. Review the real Minds-generated platform versions on the campaign detail page.
4. Edit a generated post. The UI shows an **Agent Memory Updated** notification after the edit is written to Minds memory.
5. Create a second campaign in a new session. The agent injects the learned preference into its prompt.

Use `docs/DEMO_SCRIPT.md` for a repeatable 1.5–2 minute submission recording.

## Database

The canonical schema lives in `supabase/migrations/00000_init.sql`.

It creates `creators`, `campaigns`, `platform_versions`, `follow_up_tasks`, and `learning_events`, with RLS policies and indexes.

## Documentation

- `docs/ARCHITECTURE.md`
- `docs/DEMO_SCRIPT.md`
- `docs/JUDGING_CRITERIA.md`
- `docs/SECURITY.md`

---

Built for the Creative Minds Jam #1: Hong Kong.
