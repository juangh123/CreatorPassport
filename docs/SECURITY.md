# Security Notes

## Current Audit

`npm audit --omit=dev` reports **8 vulnerabilities** at submission time:

- 1 moderate
- 7 high

## Triage Decision

Do not force dependency upgrades immediately before the demo because the reported fix path moves `next` outside the locked `16.2.11` range. Upgrading Next can change routing, build, and server behavior without enough validation time.

The reported packages are primarily transitive dependencies of Next.js, the Minds SDK toolchain, or build tooling:

- `next` / `postcss` / `sharp` — build and image-processing path.
- `nanoid`, `js-yaml`, `hono`, `fast-uri`, `brace-expansion` — transitive dependencies in the SDK and toolchain.

## Accepted Mitigations

- The app does not currently accept user-uploaded images or user-controlled CSS source maps through the vulnerable image/CSS processing path.
- Minds and Supabase credentials remain server-side only.
- `.env.local` is git-ignored.
- Supabase RLS scopes application data to the authenticated user.

## Post-Demo Action

After the submission deadline, evaluate a controlled upgrade to a stable Next.js release that includes fixed `postcss` and `sharp` dependencies, then rerun `npm run check` and the live demo flow before merging.
