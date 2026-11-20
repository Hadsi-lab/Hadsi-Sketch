# Hadsi Sketch ✏️

A step-by-step drawing guide for sketching on **real paper**. The screen shows the drawing as a big construction breakdown: guidelines, then basic shapes, then the outline, details and shading. You advance through the steps with the keyboard, a swipe, or the large buttons.

The app is fully client-side (React, Vite, TypeScript). It needs no server, no accounts and no API keys. Photos and drawings stay in the browser and are never uploaded.

## Features

- **Paper Sketching Mode (default view):** the drawing takes up most of the screen.
  - Navigation: `←` / `→`, `Space` (`Shift+Space` goes back), `Home` / `End`, swipe on the picture, or the large Back / Next buttons.
  - **Highlight new lines:** each step's new strokes are shown in colour (coral, blue, green or purple) and earlier steps in charcoal. After the outline is drawn, the construction shapes fade to grey.
  - **Keep Awake:** uses the Screen Wake Lock API so a tablet or laptop doesn't go to sleep while she draws.
  - **Print:** prints a multi-panel step sheet.
  - **Peek at finished:** shows the completed picture at any time.
  - **Quick Digital Test drawer:** a scratchpad with pencil, eraser, colours, undo and save-to-PNG. It can trace over the current step and supports pen pressure.
- **Three ways to start a sketch:**
  - **Generate Idea:** a built-in procedural generator with 5 categories (Animals & Wildlife, Fantasy Creatures, Cute Food, Sneakers & Fashion, Vehicles). It has 15 subjects, each with random variations such as expressions, accessories and patterns.
  - **Take a Photo:** front or back camera, with a 3-second countdown timer.
  - **Import Image:** drag-and-drop or a file picker (PNG, JPG, WebP), with automatic background removal and contrast boost.
  - **Optional AI generator:** "Bring Your Own API Key" for any OpenAI-compatible image endpoint. The key is stored only in `localStorage` and the request goes straight from the browser to that provider.
- **Construction controls:**
  - **Sketch detail 1–5** (Abstract → Simple Shapes → Stylized → Detailed → Realistic). For photos, this changes the blur, edge-detection thresholds, curve simplification, number of fitted ovals and the amount of shading.
  - **Steps 3–15.** Layers stay in construction order (guidelines → shapes → connectors → outline → details → shading). With fewer steps, neighbouring layers are merged. With more steps, the busiest layers are split into smaller pieces.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints. To test the camera on a phone or tablet on the same Wi-Fi, use `npm run dev -- --host`. Browsers only allow camera access over **HTTPS** (or `localhost`), so for real-device camera testing it's easiest to deploy (see below).

## Build

```bash
npm run build     # type-checks, then outputs static files to dist/
npm run preview   # serves dist/ locally
```

`dist/` is a plain static site. `vite.config.ts` uses `base: './'`, so it works at a domain root or under a sub-path.

## Deploy

Both options below give you a free public **HTTPS** URL, which the webcam feature needs.

### Cloudflare Pages

1. Push this repository to GitHub.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and pick the repo.
3. Build settings:
   - Framework preset: **Vite** (or None)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Click **Save and Deploy**. Your site will be at `https://<project>.pages.dev`.

Command-line alternative:

```bash
npm run build
npx wrangler pages deploy dist --project-name hadsi-sketch
```

### Vercel

1. Push this repository to GitHub.
2. At [vercel.com/new](https://vercel.com/new), import the repo. Vercel detects **Vite** automatically (build: `npm run build`, output: `dist`).
3. Click **Deploy**. Your site will be at `https://<project>.vercel.app`.

Command-line alternative:

```bash
npm i -g vercel
vercel --prod
```

### GitHub Pages (optional)

Build, then publish the `dist/` folder, for example with the `actions/deploy-pages` workflow. Relative asset paths mean no extra config is needed.

## Privacy

- Everything runs in the browser. There is no backend.
- Camera frames and imported images are processed in memory on a `<canvas>` and are never uploaded.
- Settings (detail level, step count, last idea) and the optional AI key are saved in `localStorage` on this device only.
- If an AI key is added, only the typed idea text is sent, and only to the endpoint configured in the key dialog.

## Project layout

```
src/
  App.tsx                 layout, keyboard/swipe navigation, state
  components/             StepCanvas, ControlsPanel, SourceHub (Generate / Camera / Import),
                          PhotoPrep, Scratchpad, PrintSheet, ApiKeyModal
  generator/              procedural SVG subjects, grouped by category
  vision/trace.ts         photo → strokes (cleanup, k-means ovals, contour, Canny edges, hatching)
  lib/                    geometry helpers, step builder, RNG, optional AI client
```

To add a new generated subject, write a `build(rng)` function with the `SB` builder in `src/generator/`. Tag each stroke as `guide`, `shape`, `connector`, `silhouette`, `detail` or `shading`, then add the subject to a category.

During `npm run dev`, open `/?gallery&level=5` to see every subject on one page (dev builds only).
