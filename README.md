# Distill

A browser-based way to get an impression of yourself, a friend, or someone you’re curious about from their tweets. Start with an archive contributed to [Community Archive](https://www.community-archive.org/), or import your own Twitter/X `.zip` export.

## Features

- Ask your own questions, or start with a suggested question about interests, personality, strengths, or weak spots.
- Choose posts, months, replies/reposts, and an AI model. Asking sends the selected posts and profile context to the provider.
- Revisit answers saved in this browser, copy them, inspect their source tweets, or delete them.
- Generate an avatar from tweets and profile details, optionally using the current avatar as a reference. Inspect the generated prompt, re-render, download, or delete an image.
- Switch between charcoal and pale-violet themes, both with fluorescent green accents. Fraunces is bundled locally; no Google Fonts request is needed.
- Browse and switch people on a dedicated page with normal page scrolling. Search sits directly above its results; loading options expand inline. Back or selecting someone returns to the previous screen without losing your draft question or post filters.
- Archives and history are stored in IndexedDB. Importing an archive here does not contribute it to Community Archive. Use the people page to remove a local archive.

## Usage

Node.js 22+ and pnpm 10.9.0 are required.

```
pnpm install
pnpm dev
```

To build for production:

```
pnpm build
```

## Interface checks

```sh
pnpm test:unit
pnpm exec eslint src e2e playwright.config.ts
pnpm exec playwright install chromium
pnpm test:e2e
```

The browser suite runs on desktop and mobile-sized Chromium, starts its own local server, and uses isolated storage, fictional archive imports, and intercepted network responses. No real AI or Community Archive requests are made. If Chrome is already installed, `DISTILL_BROWSER_CHANNEL=chrome pnpm test:e2e` can use it instead of downloading Chromium.

Screenshots and traces are written to the ignored `test-results/` directory. The suite covers theme persistence, the shared people page and import/removal flows, questions, filters, saved answer scope, inline sources, clipboard feedback, avatar generation/re-rendering/history, simplified settings, and error recovery. Layout assertions check the compact composer, answer alignment, desktop preview/control columns, in-page mobile navigation, and a single page scrollbar while browsing people. Navigation checks cover returning to drafts, changing people, browser Back, reloads, and direct links to the people page. Screenshot captures disable animations for reliable visual review.
