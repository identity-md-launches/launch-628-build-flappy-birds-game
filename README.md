# Flappy Pepe

A complete static arcade game: enter a username, flap Pepe through pipes, and keep every completed run on the leaderboard. Built with Vite, TypeScript, native controls, Canvas 2D, and local fonts/artwork.

**The leaderboard is local to this browser and site origin.** It retains every completed attempt, including zero scores and repeated names. It is not a shared internet leaderboard. There is no backend, authentication, or anti-cheat service. Runs closed before collision are not recorded. Clearing browser data removes history; storage failures retain the current run in memory and explain CSV export recovery.

## Install and run

Use Node.js 24 and npm (checked with Node 24.21.0/npm 11.19.0).

```sh
npm ci
npm run dev
```

Open Vite's printed URL. Submit a username of 2–18 letters, numbers, spaces, underscores, or hyphens. Names are trimmed and case-sensitive. The previous name can be prefilled, but submission is required each visit.

- Space / Arrow Up / click / tap the game: flap.
- P / Escape / pause button: pause or resume. Leaving the tab pauses too.
- Play again: another run. Change player: another username after finishing.
- Highest scores / Latest flights: sort the entire history; pagination exposes every entry.
- Export all scores: CSV of every run, including other pages.
- Sound button: optional synthesized effects, off by default.

## Rebuild and preview

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

The completed export is **`dist/`**: HTML, hashed JS/CSS, local WOFF2 fonts, Pepe SVG, and licenses. Vite's `base: './'` gives relative asset URLs. Preview through HTTP rather than double-clicking the module-based HTML.

## Validate

```sh
npx playwright install chromium
npm run check:browser
```

The browser script serves the real export at `/preview/` on a temporary port and closes its browser/server afterward. It writes screenshots and JSON to `artifacts/`. Tests use disposable contexts, so fixture scores do not ship. `CHROME_PATH` optionally specifies an existing Chromium executable; `TOOLCHAIN_ROOT` resolves check dependencies from an external installation.

This assignment installed dependencies outside the repository. Tool-generated local caches were removed from the deliverable; Vite scripts use Node 24 native config loading to avoid recreating its temporary config bundle. Actual commands:

```sh
PATH=/tmp/flappy-toolchain/node_modules/.bin:$PATH npm run typecheck
npm test
PATH=/tmp/flappy-toolchain/node_modules/.bin:$PATH npm run build
TOOLCHAIN_ROOT=/tmp/flappy-toolchain \
CHROME_PATH=/root/.cache/ms-playwright/chromium-1246/chrome-linux64/chrome \
npm run check:browser
npm audit
```

Actual final results, 2026-10-02:

| Check | Result |
| --- | --- |
| TypeScript typecheck | Passed, exit 0 |
| Vite 7.3.6 production build | Passed, exit 0 |
| Physics/storage tests | 11 passed, 0 failed |
| Production browser checks | 36 passed, 0 failed |
| axe WCAG automated checks | 0 violations at 1440, 820, 390, 320px |
| Sampled rendered text contrast | Selected pairs pass 4.5:1 at all four widths |
| Production page errors / failed resources | 0 / 0 in automated context |
| npm audit | 0 vulnerabilities |

Screenshots were visually inspected for desktop/mobile onboarding, empty/populated boards, pause, keyboard focus, and a 320px invalid form. Root font size at 200% was checked for reflow; this is not native browser zoom. No screen-reader session, physical-device test, Safari/Firefox check, or audio listening test was performed. The spatial game remains visual and has no fully nonvisual play mode. See [validation](artifacts/validation.md), [design documentation](DESIGN.md), and [actual browser results](artifacts/interaction-results.json).

## Publish

Publish the **contents of `dist/`** to a static host, IPFS directory, or gateway subpath. Preserve `assets/` and `licenses/` beside `index.html`, filenames, and normal MIME types. Use HTTPS publicly (localhost works for development); the game uses `crypto.randomUUID()`. There is one page with in-page anchors, so no server rewrite is required. No environment variables or credentials are needed. Fonts/art are local; the app makes no analytics/API calls.

The publisher serves the delivered export without rebuilding. After changes, run typecheck, tests, build, and applicable browser checks; include refreshed `dist/` with source and lockfile. Exclude all nested `node_modules/`, caches, temporary browser output, dependency archives, and submodules. No ignore file was created or changed. Under the assignment's `.git/` prohibition, repository metadata was not modified and no commit was made; the contributor-network publisher handles submission/commit creation.

## Files and attribution

- `src/main.ts`: page, game states, controls, board rendering.
- `src/game.ts`: physics; `src/draw.ts`: scene; `src/storage.ts`: records, ranking, CSV.
- `src/style.css`: tokens, components, responsive layouts.
- `scripts/`: repeatable unit, browser, and rendered-contrast checks.
- `public/licenses/`: font licenses copied into `dist/`.
- `artifacts/`: screenshots, actual check results, review, size report.

Applied the pinned Better Interface guidance from Jakub Krehel (MIT, commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`). Documentation followed the pinned [Impeccable method](https://github.com/pbakaus/impeccable/blob/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8/skill/reference/document.md) by Paul Bakaus (Apache-2.0, copyright 2025). Implementation-specific documents and application code were written for this assignment. Supplied combined notices are retained in `artifacts/design-guidance-LICENSE.txt`. DM Sans and Space Grotesk ship under their included SIL Open Font Licenses.
