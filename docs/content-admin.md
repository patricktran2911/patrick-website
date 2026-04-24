# Content Admin Architecture

## Overview

The portfolio now uses a JSON-backed content system with a built-in admin dashboard.

- Public content lives in `src/content/site-content.json`.
- Server-side readers and writers live in `src/lib/site-content.ts`.
- Shared TypeScript contracts live in `src/lib/site-content-schema.ts`.
- The protected dashboard UI lives in `src/app/admin`.
- Authenticated write APIs live in `src/app/api/admin`.

This keeps the public pages, metadata, navigation, and editor all pointed at the same source of truth.

## Content flow

1. Public route `page.tsx` files call `getSiteContent()`.
2. The loader reads `src/content/site-content.json` from disk at request time.
3. Each page passes just its own content slice into the client render component.
4. The admin dashboard loads the same JSON through `/api/admin/content`.
5. Saving writes the updated JSON back to disk after schema validation.

## Validation strategy

The editor supports updating values and adding or removing array items without changing the supported schema.

- Validation uses the checked-in JSON structure as the template.
- Missing keys are rejected.
- Extra keys are rejected.
- Array item shapes must match the first item in the template array.

If you want to add a brand-new field to the schema, update both:

- `src/content/site-content.json`
- `src/lib/site-content-schema.ts`

Then wire the new field into the public page that should render it.

## Admin auth

Admin access uses a signed cookie session.

- Password check: `src/lib/admin-auth.ts`
- Default password fallback: `Patrick2911@1`
- Recommended production override: set `ADMIN_PASSWORD`
- Recommended production session secret override: set `ADMIN_SESSION_SECRET`

The password is intentionally configurable through environment variables so production can move away from the fallback without code changes.

## Music URLs

The music widget now reads from a simple `songUrls` array inside the `music` section.

- Each item should be a full URL.
- YouTube watch links are supported.
- Direct audio file URLs are also supported.

This keeps the admin editing flow simple and avoids playlist-specific setup.

## Reusable editor design

`src/reusable-components/admin/JsonFieldEditor.tsx` is recursive on purpose.

- Primitive fields render as inputs, textareas, or toggles.
- Objects render as grouped cards.
- Arrays render repeatable item editors with add/remove controls.

That means new content blocks can usually be managed without creating new admin-only form code.

## Build and runtime notes

For local verification, `next.config.ts` now supports an optional `NEXT_DIST_DIR` override so production builds can run without colliding with an active dev server.

Important production caveat:

- This admin writes to the local filesystem.
- On platforms with ephemeral or read-only runtimes, changes may not persist across deploys or container restarts.

If you want durable production editing later, the next step should be moving this content store from JSON files to a database or object storage layer while keeping the same schema and admin UI patterns.
