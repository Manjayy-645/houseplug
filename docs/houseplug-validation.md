# Validation and review evidence

Local verification uses disposable PostgreSQL 17 and PostgREST containers, a fixture-only Supabase Auth gateway, and the real Next.js production server. It does not use production database credentials or send provider messages or charges. It is not a full Supabase Auth, Storage or Paystack sandbox test.

## Commands

- `npm test`: eight domain tests covering fee totals, unknowns, optional inspection costs, authorized splits, evidence scope, freshness, exact reciprocal gender preferences, safe redirects, consent/date validation, lead transitions and payment matching.
- `npm run test:db`: disposable compatibility schema, previous security migration, both new migrations and transactional SQL assertions. Exercises admin review, private fee source storage, owner reconfirmation, request idempotency, one-to-three room matching, lead authorization, roommate accepted contact/block privacy and payment retry leases.
- `npm run test:e2e`: builds the application with fixture-only public/server credentials, starts the production server and verifies browser → API → PostgREST → PostgreSQL. Five tests cover mobile home, total budget and occupancy, guest persistence/retry reference, private admin matching/advertiser transition and cross-user denial, and canonical sitemap/guide behavior. Homepage Axe AA checks and overflow checks run at 320, 360, 375, 768 and 1280 CSS pixels.
- `npm run typecheck` and `git diff --check` are required before pushing.

CI repeats these isolated checks and uploads `test-results/` screenshots/traces for seven days. Screenshots show synthetic test fixtures, not audited live inventory. Do not present them as real supply evidence.

## Limits and release blockers

The suite uses a sanitized compatibility fixture, not a clean replay of every historical migration or a production clone. Production trigger/schema/policy compatibility still requires staging rehearsal. Mock authentication verifies the app's authorization flows but does not establish production OAuth, session refresh or storage policy correctness. No real Paystack charge/refund, Resend delivery, supplier field vetting, physical property review, real-device Android test, external rich-result validation, GSC indexing or measured Core Web Vitals was performed. Legacy review credibility, identity verification lifecycle, comprehensive erasure and supplier quote/completion operations remain explicit follow-ups in the release runbook.

No production migration, production deployment or merge to main is performed by this implementation branch.

## Recorded result (11 November 2026)

The local production build, all eight unit tests, both SQL assertion blocks and all five browser tests passed. TypeScript and whitespace checks passed. The final homepage scan passed at every listed viewport; automated checks do not replace manual accessibility review. GitHub CI and Vercel preview outcomes must be checked separately after pushing.

[Mobile homepage](evidence/home-375.png) · [Desktop homepage](evidence/home-1280.png) · [Persisted request confirmation](evidence/request-success.png)
