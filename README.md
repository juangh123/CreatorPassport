# CreatorPassport ??

> **Minds Agent for Global Content Creators**
> Developed for Creative Minds Jam #1: Hong Kong

CreatorPassport is an autonomous creator-workflow agent that turns a raw idea into platform-native content for X, LinkedIn, Instagram, YouTube, and TikTok, while preserving persona consistency and sponsor-compliance guardrails.

## Status

This is currently a working prototype:

- ? Next.js 16 App Router app builds successfully.
- ? Supabase authentication, campaign creation, and generation API routes are wired.
- ? Dashboard, onboarding, campaign creation, and campaign detail flows exist.
- ?? Minds SDK integration is still mocked; memory, learning events, and autonomous follow-up tasks are not yet connected to the real SDK.

## Features

- **Multi-platform generation** for X, LinkedIn, Instagram, YouTube, and TikTok.
- **Sponsor brief constraints** stored and included in generation prompts.
- **Supabase Realtime** updates on campaign detail pages.
- **Creator profile and learning-event schema** ready for Minds memory integration.
- **RLS-enabled Postgres schema** scoped to the authenticated user.

## Architecture

- **Frontend**: Next.js 16 App Router, React 19, Tailwind CSS, Framer Motion
- **Agent Layer**: `@minds/sdk`
- **Database**: Supabase Postgres + RLS
- **UI style**: neo-brutalism / hacker aesthetic

## Getting Started

### Prerequisites

- Node.js >= 18
- Supabase project or CLI
- Minds API key

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in:

   ```bash
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   MINDS_API_KEY=...
MINDS_AGENT_ID=... # optional; omit to use mock fallback
   ```

3. **Apply the database migration**

   Use `supabase/migrations/00000_init.sql` in your Supabase project.

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev         # start development server
npm run build       # production build
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run check       # lint + typecheck + build
```

## Demo Flow

1. Open the Dashboard at `/dashboard`.
2. Click **New Campaign** to create a multi-platform request.
3. Enter raw content, sponsor constraints, and select platforms.
4. Review generated platform versions on the campaign detail page.
5. Edit a generated post to simulate feedback. The UI shows an **Agent Memory Updated** notification.

## Database

The canonical schema lives in:

- `supabase/migrations/00000_init.sql`

It creates `creators`, `campaigns`, `platform_versions`, `follow_up_tasks`, and `learning_events`, with RLS policies and indexes.

---

Built with ?? for the Creative Minds Jam.
