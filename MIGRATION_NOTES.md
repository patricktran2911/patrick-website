# Patrick Portfolio — Migration Notes

Everything you need to rebuild the site from scratch.

---

## 🔑 API Keys & Credentials

### EmailJS (Contact Form)
> Used in `src/app/contact/render.tsx` via `sendForm()` from `emailjs-com`.

| Key | Value |
|-----|-------|
| Service ID | `service_nt4r3gp` |
| Template ID | `template_2fa157s` |
| Public Key | `61MNx-0wj6lZewpbw` |

```ts
sendForm(
  "service_nt4r3gp",
  "template_2fa157s",
  e.target as HTMLFormElement,
  "61MNx-0wj6lZewpbw"
);
```

---

## 📄 External Asset Links

| Asset | URL |
|-------|-----|
| Resume PDF (Google Drive download) | `https://drive.google.com/uc?export=download&id=1i_hw3HGp1htJ259xTeN7e6mxywjAXfAw` |
| Resume PDF (Google Drive view) | `https://drive.google.com/file/d/1i_hw3HGp1htJ259xTeN7e6mxywjAXfAw/view` |

---

## 🧑‍💼 Personal / Contact Info

| Field | Value |
|-------|-------|
| Name | Patrick Tran |
| Email | patricktran291197@gmail.com |
| LinkedIn | https://linkedin.com/in/patrick-tran-99768828a |
| Location | Sacramento, CA, United States |
| Live site | https://patrickcs-web.com |

---

## 🚀 Deployment

- **Platform:** AWS Amplify
- **Dev command:** `npm run dev` (Next.js 15 + Turbopack)
- **Build command:** `npm run build`
- **Start command:** `npm run start`

---

## 🗂️ Project Data

Projects are hardcoded in `src/app/projects/render.tsx`.

| Title | Tech | Live Link | Icon path |
|-------|------|-----------|-----------|
| NeuroSpring Hospital Camera | React, TypeScript, Python, WebRTC, MediaPipe | https://neurospring.org/current-projects | `/Assets/images/neurospring_logo.png` |
| iOS FanFly App | SwiftUI, UIKit, Figma, Alamofire | https://fanfly.live | `/Assets/images/fanfly-icon.png` |
| Scoop iOS | SwiftUI, UIKit, PromiseKit, Alamofire | `#` (no public link) | `/Assets/images/scoop-icon.png` |
| iUSC Citizenship Prep | SwiftUI, Combine, CoreData, UIKit, In-App Purchase | https://apps.apple.com/us/app/iusc/id6745776441 | `/Assets/images/iUSC-icon.png` |

---

## 🎨 Design System

### Tailwind Custom Colors (`tailwind.config.js`)
```js
colors: {
  primary:    "#1DA1F2",
  secondary:  "#14171A",
  accent:     "#657786",
  neutral:    "#AAB8C2",
  "base-100": "#FFFFFF",
  info:       "#1E90FF",
  success:    "#28A745",
  warning:    "#FFC107",
  error:      "#DC3545",
}
```

### Custom Breakpoints
```js
screens: {
  xs:   "320px",
  sm:   "640px",
  md:   "768px",
  lg:   "1024px",
  xl:   "1280px",
  "2xl":"1536px",
  xxl:  "1920px",
}
```

### Fonts (Google Fonts via `next/font`)
- **Sans:** `Geist` → CSS var `--font-geist-sans`
- **Mono:** `Geist_Mono` → CSS var `--font-geist-mono`

### Background
- Fullscreen looping video: `/assets/videos/bg-video1.webm` + `.mp4` fallback
- Poster/thumbnail: `/Assets/images/background-thumbnail.png`
- Dark overlay: `bg-black/70`

---

## 📦 Dependencies

### Runtime
```json
{
  "emailjs-com": "^3.2.0",
  "framer-motion": "^12.9.2",
  "lucide-react": "^0.503.0",
  "next": "15.3.1",
  "react": "^19.0.0",
  "react-aws-icons": "^1.2.1",
  "react-dom": "^19.0.0",
  "react-icons": "^5.5.0"
}
```

### Dev
```json
{
  "@eslint/eslintrc": "^3",
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "15.3.1",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

---

## 🏗️ Architecture Conventions

- **Framework:** Next.js 15 App Router (no `pages/` dir)
- **Styling:** Tailwind CSS v4 — use `@import "tailwindcss"` in CSS, NOT `@tailwind` directives
- **Animations:** Framer Motion only (no CSS transitions for enter/exit)
- **Page pattern:** every route = `page.tsx` (server, exports `metadata`) + `render.tsx` (`"use client"`, all UI)
- **Path aliases:** `@/*` → `src/*` | `images/*` → `public/Assets/images/*` | `videos/*` → `public/Assets/videos/*`
- **Asset casing:** use `/Assets/` (capital A) — lowercase fails on case-sensitive systems

### Route List
| Route | Display Name |
|-------|-------------|
| `/` | Home |
| `/about` | About |
| `/projects` | Projects |
| `/my-skills` | Skills |
| `/resume` | Resume |
| `/contact` | Contact |

---

## 🗃️ Static Assets to Copy

```
public/Assets/
  images/
    background-thumbnail.png
    neurospring_logo.png
    fanfly-icon.png
    scoop-icon.png
    iUSC-icon.png
    resume-thumbnail.png
  videos/
    bg-video1.webm
    bg-video1.mp4
  pdf/
    (resume PDF)
```

---

## ⚙️ Config Files to Recreate

- `next.config.ts` — Turbopack enabled, resolves `.mdx .tsx .ts .jsx .js .mjs .json`
- `postcss.config.mjs` — `plugins: ["@tailwindcss/postcss"]`
- `tailwind.config.js` — custom colors + breakpoints (see Design System above)
- `tsconfig.json` — path aliases `@/*`, `images/*`, `videos/*`
- `aws-logo.d.ts` — custom type declaration for `react-aws-icons`
- `video.d.ts` — module declarations for `*.mp4` and `*.mp4.webm`
- `eslint.config.mjs` — extends `next/core-web-vitals`, `next/typescript`; rules: `react/no-unescaped-entities: off`, `@next/next/no-page-custom-font: off`

---

## ⚠️ Gotchas

1. **EmailJS keys are hardcoded** in `contact/render.tsx` — move to `.env.local` in the new project (`NEXT_PUBLIC_EMAILJS_SERVICE_ID`, etc.)
2. Tailwind v4 uses `@import "tailwindcss"` — do NOT use v3 `@tailwind base/components/utilities`
3. `page.tsx` must stay a Server Component (no `"use client"`) for `metadata` exports to work
4. `react-aws-icons` has no types — keep the `aws-logo.d.ts` declaration file
5. Resume PDF is hosted on Google Drive — confirm the share link is still public when migrating
