# HousePlug visual restoration

Visual baseline confirmed by the founder after reviewing screenshots: `5fbba2e` (last working main design). Before-restoration code: `2373a5a` (the deployed preview source). Restoration branch: `fix/restore-houseplug-visuals`, based on the existing functional implementation branch. No merge, deployment or production data change is part of this task.

## Root cause

The functional implementation commit `064df20` replaced the original homepage and hero search markup with simplified sections. The mobile photo hero, gradient overlays, rounded search treatment, campus crests, illustrated steps, roommate banner decoration and detailed footer were lost or reduced. This is a presentation regression in `app/page.tsx` and `components/hero-search.tsx`.

The Tailwind content paths, theme/brand tokens, PostCSS configuration and Inter import were preserved. `app/globals.css` retained its Tailwind directives and only gained focus/reduced-motion accessibility rules. The local production builds of both Git versions loaded their two CSS bundles with HTTP 200 and rendered Inter at weight 900 for the H1. No uncaught browser page errors were recorded. Vercel's existing preview build logs also show successful compilation and a completed build, with no CSS build error.

The protected Vercel preview was not opened through a public-share bypass. Its source was reproduced locally instead. Consequently these observations verify the exact source/build pipeline in isolation; they do not independently exclude a user-specific cache or protected-preview asset request problem. Local Vercel Analytics requests return 404 outside the Vercel platform; aborted Next.js route prefetches are also recorded in the raw browser reports. Neither is a missing stylesheet.

## Restored presentation

- Original HousePlug green/amber palette and Inter typography; stronger heading hierarchy.
- Original campus background photograph, dark green overlays, rounded white search surface, amber primary button and rounded secondary CTAs.
- Campus crests, white campus cards, original property-card component, illustrated steps, white/gray section rhythm and amber heading accents.
- Green gradient roommate banner with decorative illustration, polished assistance/guide/FAQ surfaces and a fuller branded footer.
- Mobile layout, minimum touch targets and the improved accessibility behavior remain in place. Hero search uses native labelled controls while retaining its campus, area, room-type and total-budget contract.
- Tablet navigation keeps the existing hamburger menu until 1280px, preventing the desktop links from crowding the logo and clipping the sign-up action.

## Before-and-after evidence

All screenshots were captured from browser-rendered local builds with synthetic listing data. The original commit was rendered in an isolated worktree against a disposable compatibility database. The original screenshot is a historical design reference: its outdated claims and unsupported split labels remain suppressed in restored code. Screenshots were produced and shown to the founder before homepage presentation changes began.

| Viewport | Original working design | Preview code before restoration | Restored |
| --- | --- | --- | --- |
| 375px mobile | [Original](evidence/visual-restoration/original-375.png) | [Before](evidence/visual-restoration/regressed-375.png) | [Restored](evidence/visual-restoration/restored-375.png) |
| 768px tablet | [Original](evidence/visual-restoration/original-768.png) | [Before](evidence/visual-restoration/regressed-768.png) | [Restored](evidence/visual-restoration/restored-768.png) |
| 1440px desktop | [Original](evidence/visual-restoration/original-1440.png) | [Before](evidence/visual-restoration/regressed-1440.png) | [Restored](evidence/visual-restoration/restored-1440.png) |

The [comparison viewer](evidence/visual-restoration/compare.html) works locally alongside the PNG files. Raw asset/font/console observations are in `original-browser.json`, `regressed-browser.json` and `restored-browser.json` in the same folder.

## Features preserved

Pricing and unknown-total calculations, scoped verification, expiry/freshness and eligible campus counts, public/private contact projections, SEO/canonicals, consent and authorization controls are retained. Search submits the existing `university`, `q`, `room_type` and `max_total` parameters. Listing contact remains **Chat With Agent on WhatsApp**, with property name/reference/URL in the message. Clicks stay separate from confirmed enquiries or outcomes. Optional assistance does not gate agent contact; no inspection booking workflow is added. Roommate routes, campus services and their existing privacy/vetting controls remain available through navigation.

## Files changed

| Files | Purpose |
| --- | --- |
| `app/page.tsx` | Restore the homepage presentation; retain current metadata, eligibility queries, safe projections and truthful copy |
| `components/hero-search.tsx` | Restore the rounded search treatment while retaining the functional filter names and native labels |
| `components/home/site-footer.tsx` | Restore the branded footer and existing navigation/support/community destinations |
| `components/header.tsx` | Keep the existing compact navigation on tablets and prevent clipped header links |
| `tests/e2e/housing.spec.ts` | Add 1440px coverage, image/CSS/font/brand checks, tablet menu/visible link bounds and complete hero-search filter regression |
| `scripts/qa-local.mjs`, `scripts/capture-home.mjs`, `tests/fixtures/visual-original-seed.sql` | Reproduce Git versions with local-only fixtures; keep the local gateway responsive during asynchronous builds; capture evidence |
| `package.json`, `package-lock.json`, `.eslintrc.visual.json`, `.github/workflows/quality.yml` | Add pinned Next-compatible development lint tooling and a focused visual-file lint gate |
| `vercel.json` | Disable automatic deployments for the visual review branch |
| `GEMINI.md` | Record the requirement to show baseline screenshots before future large visual changes |
| This report and `docs/evidence/visual-restoration/` | Findings, screenshots, browser observations and the existing broad-lint baseline |

No global design token, font import, Tailwind content path or PostCSS change was necessary.

## Validation

- Production build: passed through `npm run test:e2e`, which runs `npm run build` with disposable local credentials before starting the production server.
- TypeScript: `npm run typecheck` passed.
- Focused lint: `npm run lint` passed with zero errors and covers every changed product TSX file with Next core-web-vitals rules. One pre-existing warning remains for the header's avatar `<img>`. The repository previously had no installed ESLint/configuration.
- Domain regression suite: `npm test` passed (13 tests).
- Browser/API/database suite passed (9 tests), including real filter navigation, fees, privacy, direct WhatsApp contact, nonblocking tracking, optional requests and canonical URLs.
- Disposable SQL assertions: `npm run test:db` passed.
- A clean dependency installation (`npm ci`) passed.
- Homepage Axe/overflow/brand/image checks cover 320, 360, 375, 768, 1280 and 1440px.
- Full-repository lint was also inspected: 48 existing errors and 39 warnings in pre-existing code. These remain outside this visual change; see [the baseline report](evidence/visual-restoration/full-lint-baseline.json). The focused lint gate does not claim those files are clean.

## Remaining review limitations

Visual acceptance is based on the founder-approved original and local screenshots, not a newly deployed site. The existing Vercel preview still serves the previous commit. Screenshots show one eligible fixture and honest empty campus states; they are not evidence of live supply. Required fee/availability disclosures, guides and FAQs make the restored mobile page longer than the historical reference. Real-device Android testing, user-specific preview cache behavior and final human visual sign-off remain unverified. The tests recorded no stylesheet request failures, uncaught rendering errors or horizontal overflow at the tested sizes.
