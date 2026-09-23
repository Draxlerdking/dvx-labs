# DVX Labs — Studio Website

Futuristic multi-page portfolio for the DVX Labs digital studio.
Zero dependencies · semantic HTML · modern CSS · vanilla JS.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Home — cinematic hero, interactive workspace, section teasers linking to the subpages |
| `expertise.html` | Full capabilities: three-layer stack, toolkit grid, capability FAQ |
| `work.html` | Selected work with case-study framework and honest status labels |
| `process.html` | The four-stage process expanded: weekly rhythm, stage-by-stage detail, FAQ |
| `about.html` | Studio story, operating principles, who you work with, FAQ |
| `contact.html` | Brief-writing guide, direct channels, full form (budget field), process FAQ |

## Files

| File | Purpose |
| --- | --- |
| `index.html` + 5 subpages | **Production site.** Self-contained (CSS + JS inlined). Open directly or deploy as-is. |
| `src/partials/` | Shared page chrome: `head` (SEO tokens), `nav`, `footer`, `overlays` (home + subpage variants). |
| `src/pages/*.body.html` | Per-page main content. |
| `src/fragments/*.section.html` | Sections shared between home (as teasers) and subpages (full versions). |
| `src/styles.css` | Design system: colours, typography, components, responsive rules, reduced-motion. |
| `src/app.js` | Interaction layer: intro, nav (active by page), reveal, cursor, parallax, tilt, form validation, scramble, magnetic buttons, particle constellation, command palette (page navigation), workspace tabs, terminal type-out, scroll progress, cursor light, HUD. |
| `favicon.svg` / `og-image.svg` | Brand assets (og-image doubles as the social share card). |
| `build.mjs` | Assembles partials + bodies + tokens into self-contained pages. Run `node build.mjs` after every edit. |
| `serve.mjs` | Tiny static server for local preview: `node serve.mjs` → http://127.0.0.1:4173 (or set `PORT`). |

## Workflow

1. Edit files in `src/` (partials, fragments, or page bodies).
2. Run `node build.mjs` — rebuilds all six pages.
3. Open any page directly, or run `node serve.mjs` for realistic relative-URL navigation.

## Interactive features

- **Command palette** — `Ctrl+K` / `⌘K` (or the nav trigger): jump to any page, copy the email, toggle ambient motion. `Escape` closes from anywhere.
- **Hero particle constellation** — cursor-reactive canvas; hidden when the hero leaves the viewport.
- **Workspace file tabs** — switch between `experience.ts`, `launch.sh`, and `status.log` with a staggered print animation.
- **About terminal type-out** — values type themselves in when scrolled into view.
- **Text scramble decode** on section headings; **magnetic** CTA buttons (fine pointers only).
- **Section progress rail** (right edge) + **HUD readout** (section/page · scroll % · live fps) on every page; the rail tracks in-page sections on home and page position on subpages.
- **Scroll progress line** (top) + page-wide **cursor light**.
- **Ambient motion toggle** persists via `localStorage` and pauses every canvas/CSS animation.

## Accessibility & performance notes

- Semantic landmarks, skip link, visible focus rings, keyboard-operable menu (Escape + outside click close).
- Intro plays once per session; fully disabled under `prefers-reduced-motion`.
- Cursor / parallax / tilt active only for fine pointers with hover, all rAF-throttled.
- Ticker pauses on hover; static layout for reduced-motion users.
- No external JS dependencies; only Google Fonts is fetched remotely.

## Still required from the owner (all marked `<!-- PLACEHOLDER -->` in source)

1. Real domain — canonical URL, OG/Twitter URLs (`https://dvxlabs.example.com`).
2. Real email address (`hello@dvxlabs.example.com`).
3. Real GitHub / LinkedIn URLs and X/Twitter handle.
4. Structured-data email + service details (locations served, pricing model if desired).
5. Form backend (Formspree / Basin / own endpoint) — currently shows success state without sending.
6. Project 01–03 details: names, categories, descriptions, tech tags, screenshots, live/case-study/GitHub links, measurable results.
7. Owner name, location, founding year for the About section.
8. Favicon/App-icon PNG set if legacy support is needed (SVG favicon only for now).
9. og-image.svg → 1200×630 PNG for platforms that don't render SVG previews.
