# Patrick Tran Portfolio — Copilot Instructions

## Architecture

- **Next.js 15 App Router** with Turbopack (`next dev --turbopack`). No `pages/` directory.
- **TypeScript**, **Tailwind CSS v4** (via `@tailwindcss/postcss` plugin), **Framer Motion** for animations.
- Deployed on **AWS Amplify**. Live at [patrickcs-web.com](https://patrickcs-web.com).

## Project Structure

```
src/app/           → App Router pages (about, contact, my-skills, projects, resume)
src/reusable-components/  → Shared UI components (NavBar, Modal)
public/Assets/     → Static assets (images/, videos/, pdf/)
```

## Page Pattern (Server + Client Split)

Every route uses a two-file convention:

- **`page.tsx`** — Server Component. Exports `metadata` (Metadata type) and renders the client component. No `"use client"` directive.
- **`render.tsx`** — Client Component (`"use client"`). Contains all interactive UI, Framer Motion animations, and state.

Example (`src/app/about/`):

```tsx
// page.tsx — server, metadata only
import { Metadata } from "next";
import About from "./render";
export const metadata: Metadata = { title: "About | Patrick Tran", ... };
export default function Page() { return <About />; }

// render.tsx — client, all UI and animation logic
"use client";
import { motion } from "framer-motion";
export default function About() { ... }
```

**Follow this pattern for all new pages.** Do not put `"use client"` in `page.tsx`.

## Styling & Theming

- Tailwind v4 with `@import "tailwindcss"` in `globals.css` (not `@tailwind` directives).
- Custom color tokens defined in `tailwind.config.js` (`primary`, `secondary`, `accent`, etc.).
- Custom breakpoints: `xs: 320px` through `xxl: 1920px`.
- Opacity-hover pattern on main content: `lg:opacity-90 hover:opacity-100 transition-opacity`.
- Background: fullscreen looping video (`layout.tsx`) with dark overlay (`bg-black/70`).

## Animation Conventions

- Use `framer-motion` (`motion.*` components) for all animations — not CSS transitions for enter/exit.
- Standard page entrance: header fades in with `y` offset, sections use `whileInView` with staggered delays.
- Reuse variant objects (`sectionVariants`, `containerVariants`) at the top of render files.

## Navigation

Routes: `about`, `projects`, `my-skills`, `resume`, `contact`. The NavBar maps these with display names (e.g., `my-skills` → "Skills"). When adding a route, update the array in `src/reusable-components/NavBar.tsx`.

## Key Dependencies & Integrations

- **emailjs-com** — Contact form sends email client-side via `sendForm()` (service/template IDs in `contact/render.tsx`).
- **react-icons** (`SiTypescript`, etc.) + **lucide-react** (`Menu`, `X`) for icons.
- **react-aws-icons** — Custom `.d.ts` declaration in `aws-logo.d.ts`.

## Path Aliases (tsconfig)

- `@/*` → `./src/*` (use for component imports: `import Modal from "@/reusable-components/Modal"`)
- `images/*` → `./public/Assets/images/*`
- `videos/*` → `./public/Assets/videos/*`

## Static Assets

Place images in `public/Assets/images/`, videos in `public/Assets/videos/`, PDFs in `public/Assets/pdf/`. Reference from code as `/Assets/images/filename.png` (lowercase `/assets/` may fail on case-sensitive systems — use `/Assets/`).

## Dev Workflow

```bash
npm run dev    # Starts Next.js dev server with Turbopack
npm run build  # Production build
npm run lint   # ESLint (next/core-web-vitals + next/typescript)
```

## Things to Avoid

- Do not add `"use client"` to `page.tsx` files — keep metadata exports server-side.
- Do not use Tailwind v3 `@tailwind base/components/utilities` syntax; use `@import "tailwindcss"`.
- Do not hardcode absolute system paths for assets — use path aliases or `/Assets/` public paths.
