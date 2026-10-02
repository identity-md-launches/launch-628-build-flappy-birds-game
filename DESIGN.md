# Flappy Pepe design system

## Overview

A playful browser arcade for quick repeat sessions: warm paper, dark green type, lime controls, and a locally illustrated Pepe. The game takes priority over the browser-local leaderboard. Humor belongs in supporting copy; validation and storage errors give clear recovery instructions.

The source of truth is `src/style.css`. `src/main.ts` contains native DOM patterns and state templates, `src/draw.ts` paints the canvas, and `src/assets/pepe.svg` supplies the reusable character. This is a single-page Vite/TypeScript app without a UI framework.

## Colors

The UI uses these `:root` semantic tokens in `src/style.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--page` | `#f7f7ef` | Page and neutral controls |
| `--surface` | `#fffef8` | Cards, fields, result panels, error backing |
| `--text` | `#242b22` | Headings, body, button labels, input hints |
| `--muted` | `#656b5e` | Secondary prose, counts, timestamps |
| `--line` | `#dedfd3` | Structural borders/dividers |
| `--accent` | `#c3ee75` | Primary action and selection |
| `--accent-hover` | `#b3df61` | Primary hover |
| `--accent-soft` | `#edf4de` | Icon plates and subtle hover surfaces |
| `--control-border` | `#868e7a` | Input/select boundaries |
| `--focus` | `#34552c` | Keyboard outline |
| `--error` | `#a4322e` | Error copy and invalid input boundary |

Canvas colors are illustration constants in `src/draw.ts`: sky `#dfede7`, sun `#f8f2cd`, clouds `#f8fcf4`, hills `#c3d8ae`, bushes `#abc88f`, ground `#d4deb0`, green pipe highlights and outlines. The mobile onboarding overlay uses `#dfede799`; validation text has an opaque surface. There is one light theme. Forced-colors CSS uses system `Canvas`, `ButtonText`, and `Highlight`.

Measured pairs: primary text/page 13.51:1; muted/page 5.11:1; muted/surface 5.44:1; primary button 10.95:1. The 320px input hint's minimum sampled scene contrast is 6.70:1. See `artifacts/contrast-results.json` for measurements and `artifacts/validation.md` for coverage limits.

## Typography

Bundled normal variable WOFF2 fonts in `src/assets/` use `font-display: swap` and `sans-serif` fallbacks. DM Sans declares weights 100–1000; Space Grotesk 300–700. UI weights range from 400 to 700. Both fonts were observed loaded in Chromium. Font synthesis is disabled. Licenses are in `public/licenses/` and `dist/licenses/`.

| Role | Implemented values |
| --- | --- |
| Hero | Space Grotesk 700, `clamp(2.6rem,4.8vw,3.6rem)`, line-height 1.14, tracking -3.2px; 42px/-2.4px below 35rem |
| Brand | Space Grotesk 25px, 700/500; 22px mobile; 19px below 23rem |
| Game heading | Space Grotesk 29px, line-height 1.1, tracking -1.3px; 27px onboarding on mobile |
| Section headings | Space Grotesk 21–23px; flight-school line-height 1.25 |
| UI/prose | DM Sans, 12–16px by density; descriptive line-height 1.5–1.7 |
| Inputs | 16px at every viewport |
| Captions | 10–12px; uppercase is CSS presentation |
| Scores | Space Grotesk, tabular numbers; toolbar 18–20px, table 19px, results 54px |

Named sizes: `--text-xs: .75rem`, `--text-sm: .875rem`, `--text-body: 1rem`, `--text-title: 1.375rem`. The last two are reserved values; display/caption rules use explicit sizes. Headings balance wrapping, prose uses pretty wrapping, and instruction descriptions cap at 32ch. Usernames wrap and use `<bdi>` isolation. Only the game input surface suppresses selection.

## Layout

`.wrap` has a maximum width of 1256px including 36px inline padding. The desktop grid is `minmax(0,1fr) 330px` with a 24px gap. DOM/mobile order: introduction, game, leaderboard, instructions, footer. The leaderboard shows five entries per page and retains all historical entries.

The recurring spacing scale is 4, 8, 12, 16, 24, 32, 48px, declared as `--space-1/2/3/4/6/8/12` for reuse. Existing rules primarily express these dimensions literally.

| Breakpoint | Behavior |
| --- | --- |
| Above 65rem | 330px leaderboard, 36px insets, four-column instructions |
| At/below 65rem | 300px leaderboard, 24px insets, 18px grid gap, hide header caption |
| At/below 53rem | One-column game/board, two-column instructions, 450px stage, horizontal board footer |
| At/below 35rem | 18px insets, 80px header, 42px hero, compact toolbar, softened onboarding scene |
| At/below 23rem | Compact brand/header, unwrapped help link and pond label, tighter score controls |

Desktop stage height is 440px. Canvas rendering accounts for device pixel ratio up to 2. Each flight uses its starting stage dimensions; resizing scales that existing world to preserve physics. State panels wrap internally. Inspected widths: 1440, 820, 390, 320 CSS pixels, including a 320px invalid form. Native zoom and translated/RTL layouts were not verified.

## Elevation & Depth

Cards have 1px structural borders. Primary buttons use `0 3px 0 #8ba458` solid arcade shadows. Result/pause panels use `0 6px 30px #35452b14`. The stage isolates stacking: canvas, input surface at z-index 1, state overlay at z-index 2. Decorative overlay areas ignore pointer events; their actual controls accept them. These are inline game panels, not modal dialogs.

## Shapes

Cards use `--radius: 16px`; results 14px; icon buttons 10px; inputs/primary buttons 8px; selects 6px; small labels 3–5px. Circular avatars reuse the local SVG. Canvas pipes intentionally use square geometry and dark outlines.

## Components

These are actual DOM/CSS patterns in `src/main.ts` and `src/style.css`, not an exported component library.

- **Page shell:** `.wrap`, `.site-header`, `.intro`, `.arcade-layout`, `.how-to`, `.site-footer`.
- **Primary action:** `.primary-button`; one lime action in the current game state. Pointer hover uses `--accent-hover`. 120ms background/transform transitions and scale `.96` apply only with no reduced-motion preference.
- **Secondary controls:** `.icon-button`, `.small`, `.text-button`; native disabled states, icon-only accessible labels, sound `aria-pressed`. General targets are 44px, mobile 40px; compact pause stays at least 28×36px.
- **Username field:** `welcome()`, `.username-field`, `.field-hint`, `.field-error`; persistent label, 2–18-character hint, submit validation, associated live error and invalid-field focus. Valid editing clears prior error state. Names may be prefilled, but submission is required each visit.
- **Game states:** `start()`, `pause()`, `resume()`, `finish()`; full-stage native button for pointer/touch/Space/Arrow Up. P/Escape toggle pause. Focus moves to flap, resume, retry, or username as appropriate. Page blur/hidden state pauses. Stable status announcements describe transitions. Sound starts off.
- **Leaderboard:** `renderBoard()` and `src/storage.ts`; semantic table, native sort, pagination with disabled boundaries, local badge, empty state, latest-run highlight, “you” labels, all-score CSV. Storage failures retain the run in memory and explain export recovery.
- **Artwork/icons:** `icon()` uses one SVG stroke style (1.7px, `currentColor`) and hides decorative icons from assistive technology. Local `pepe.svg` supplies the character. Essential gameplay motion starts only after submission; no idle autoplay.

All interactive controls retain a 3px `--focus` outline, usually offset 4px; the game surface draws it inward. There is no modal focus trap or loading skeleton because state/data operations are synchronous and local.

## Do's and Don'ts

- Reuse the container, semantic colors, two typefaces, and native controls. Keep one primary action per game state.
- Keep every completed attempt and clearly label local data. Never populate the real board with fake players.
- Measure text over the actual scene; automated scans alone miss canvas contrast problems.
- Let names wrap, preserve reading order, retain visible focus, and keep input text at 16px.
- Avoid runtime CDN assets, speculative themes, account/wallet flows, and unrelated motion.
- For another simple page, reuse the header/container/footer and heading hierarchy. Use a hash section or explicitly exported HTML so publishing needs no route rewrite.
