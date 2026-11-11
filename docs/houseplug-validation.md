# Validation and review evidence

Local verification uses disposable PostgreSQL 17 and PostgREST containers, a fixture-only Supabase Auth gateway, and the real Next.js production server. It does not use production database credentials or send provider messages or charges. It is not a full Supabase Auth, Storage or Paystack sandbox test.

## Commands

- `npm test`: thirteen domain tests covering direct WhatsApp messages/number handling, public contact projections, fee totals, unknowns, optional inspection costs, authorized splits, evidence scope, freshness, exact reciprocal gender preferences, safe redirects, consent/date validation, lead transitions and payment matching.
- `npm run test:db`: disposable compatibility schema, previous security migration, both new migrations and transactional SQL assertions. Exercises admin review, private fee source storage, owner reconfirmation, request idempotency, one-to-three room matching, lead authorization, roommate accepted contact/block privacy and payment retry leases.
- `npm run test:e2e`: builds the application with fixture-only public/server credentials, starts the production server and verifies browser → API → PostgREST → PostgreSQL. Eight tests cover mobile home, total budget and occupancy, guest persistence/retry reference, optional private assistance with no agent assignment and cross-user denial, and canonical sitemap/guide behavior. Homepage Axe AA checks and overflow checks run at 320, 360, 375, 768 and 1280 CSS pixels.
- Direct-contact regression cases additionally prove exact desktop/mobile/sticky CTA copy, name/reference/URL in decoded messages, no login/request/assignment prerequisite, correct legacy click increments and deduplicated intent, unchanged request/audit/outbox records after clicks, tracking-outage resilience, rejected confirmed-stage events, and unpublished/private/missing-contact behavior. External wa.me requests are intercepted locally; no WhatsApp message is sent.
- `npm run typecheck` and `git diff --check` are required before pushing.

CI repeats these isolated checks and uploads `test-results/` screenshots/traces for seven days. Screenshots show synthetic test fixtures, not audited live inventory. Do not present them as real supply evidence.

## Limits and release blockers

The suite uses a sanitized compatibility fixture, not a clean replay of every historical migration or a production clone. Production trigger/schema/policy compatibility still requires staging rehearsal. Mock authentication verifies the app's authorization flows but does not establish production OAuth, session refresh or storage policy correctness. No real Paystack charge/refund, Resend delivery, supplier field vetting, physical property review, real-device Android test, external rich-result validation, GSC indexing or measured Core Web Vitals was performed. Legacy review credibility, identity verification lifecycle, comprehensive erasure and supplier quote/completion operations remain explicit follow-ups in the release runbook.

No production migration, production deployment or merge to main is performed by this implementation branch.

## Recorded result (11 November 2026)

The local production build, all thirteen unit tests, both SQL assertion blocks and all eight browser tests passed. TypeScript and whitespace checks passed. The final homepage scan passed at every listed viewport; automated checks do not replace manual accessibility review. GitHub CI and Vercel preview outcomes must be checked separately after pushing.

[Mobile homepage](evidence/home-375.png) · [Desktop homepage](evidence/home-1280.png) · [Persisted request confirmation](evidence/request-success.png)

## Product correction review

The current acceptance contract is [HousePlug direct WhatsApp model](houseplug-direct-contact-model.md). Review the code and browser evidence before any merge or deployment. Optional assistance is tested without an assigned agent, and appointment-confirmation states are rejected. The branch-specific Vercel Git deployment guard prevents automatic preview publication while this correction is awaiting review.

[Direct contact on mobile](evidence/direct-contact-375.png) · [Direct contact on desktop](evidence/direct-contact-1280.png). These screenshots include the reconciled fee presentation; the legacy “no agent fee” claim no longer appears when structured agency fees exist.

This correction adds no production migration and does not modify the two pending application migrations. Only disposable QA fixtures replay the original click-counter/activity migrations to verify existing tracking.

## CI follow-up

GitHub CI caught the mobile navigation during its opacity fade, when visible labels temporarily failed AA contrast. The navigation now switches visibility without fading text, and mobile accessibility checks explicitly wait for the navigation to appear before scanning it. This fixes the component rather than suppressing or relaxing the contrast check.
