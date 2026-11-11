# HousePlug implementation and release runbook

## Founder decisions (11 November 2026)

The governing contract is [direct student-to-agent WhatsApp contact](houseplug-direct-contact-model.md). The listing’s primary action is “Chat With Agent on WhatsApp.” Optional assistance, internal routing and reported outcomes never gate this action. HousePlug cannot monitor private conversations. Keep PR #3 draft; no merge or deployment until this correction is reviewed.

HousePlug takes housing requests and connects students with advertisers. Students arrange inspections independently. This supersedes the brief's appointment, attendance, collision, reminder and inspection SLA engine. No appointment booking or inspection completion claim is implemented. Automatic Vercel deployments are disabled specifically for `feat/master-brief-implementation` in vercel.json during review; other branches retain their existing behavior. The meaningful stages are submitted → qualified → matching → connected → reported rental / closed. A reported rental is not independent proof of a move-in.

Canonical origin: https://www.houseplug.ng. Retention controls remain configurable and automatic deletion is disabled by default. Housing request monetization is exploratory; intake is free and no new housing request payment product exists.

## What is implemented in this branch

- Integer-naira itemized mandatory fees, unknown totals, separate renewal/inspection disclosures, admin review evidence, scoped checks, owner-approved occupancy, freshness filters and owner reconfirmation.
- Mobile homepage, honest eligible inventory counts and empty states, total budget browse, public listing data minimization, canonical metadata and preview indexing controls.
- Optional guest/signed-in consented housing requests, transactional references, idempotency/rate limits, private inboxes, guarded stages, optional assistance routing, one-to-three current budget-compatible room suggestions and audit records.
- Private notification outbox with leased retries, protected maintenance endpoint, optional operational email adapter. No outbound messages were sent during development.
- Opt-in expiring roommate discovery, private raw profiles, reciprocal requests and accepted contact sharing with revoke/block controls.
- Supplier vetting evidence and a disabled-by-default service enquiry pilot, abuse reports, own-data export, reviewed guide publishing, referrals and an outcomes dashboard.
- Existing payment products receive exact server-order validation and recoverable fulfilment leases. No rent holding, escrow, student enquiry charge or new paid product.

## Coverage and remaining work

| Brief area                       | State                                       | Remaining acceptance work                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery/audit/priority backlog | Existing audit plus this implementation     | Refresh live field sample before release                                                                                                                                                                         |
| Fees/occupancy/availability      | Implemented; needs data verification        | Reconcile every promoted listing against actual advertiser evidence; do not backfill unknowns as zero                                                                                                            |
| Verification                     | Partial, scoped property review implemented | Identity review expiry/revocation must be reconciled with legacy verification workflow and restricted storage; physical checks require actual field evidence                                                     |
| Lead workflow                    | Implemented to connection model             | Staff/operator ownership, support hours and real advertiser response measurements                                                                                                                                |
| Inspection engine                | Superseded by founder                       | Students arrange directly; no attendance KPI                                                                                                                                                                     |
| Homepage/browse                  | Implemented                                 | Real low-end Android, keyboard and bandwidth testing; adjacent-budget recommendations remain basic                                                                                                               |
| Campus SEO/content               | Partial                                     | Original neighbourhood reporting, substantive reviewed local guides, GSC baseline and live indexing checks; thin/empty hubs remain noindex                                                                       |
| Telemetry/dashboard              | Partial                                     | Server lead stages and basic client intent events implemented; validate deduplicated client events, visit denominators, source cohorts and experiments before relying on conversion rates                        |
| Agent operations                 | Partial                                     | Contact verification, document retention process, response escalation, quality scoring and stronger duplicate/media review                                                                                       |
| Roommate safety                  | Partial                                     | Human moderation coverage, youth/age policy, free-text privacy screening and legacy-profile consent rollout                                                                                                      |
| Services                         | Pilot behind flag                           | Real vetted supply, supplier quote/accept/completion lifecycle, complaints staffing and category safety review before enablement                                                                                 |
| Privacy                          | Partial                                     | Guest rights verification, complete erasure orchestration across storage/audits/payments and legal retention schedule; configurable maintenance only redacts terminal lead contact and deletes old funnel events |
| Growth/monetization              | Referral tooling and operating plan         | Ambassador terms, field partnerships and reviewed monetization experiment; no fees enabled                                                                                                                       |
| Performance/SEO outcomes         | Unproven                                    | Real-user p75 LCP/INP/CLS, Search Console and measured acquisition; no ranking or growth claims                                                                                                                  |

This is a broad implementation branch, not a declaration that every operational requirement is production complete. Use the existing P0–P3 backlog for remaining delivery; the gates above precede expansion and paid request experiments.

## Migration and rollout

New migrations, not applied to production in this turn:

1. `20261111023137_housing_truth_and_conversion.sql`
2. `20261111025356_payment_fulfilment_recovery.sql`

The previously applied `20261111020101_houseplug_profile_and_internal_function_security.sql` must not be applied twice. Local tests replay it against a sanitized compatibility schema, not an assertion that all historical migrations cleanly rebuild production.

**Coordinated release required.** New profile/listing foreign keys make legacy PostgREST profile joins ambiguous; this application uses explicit landlord FK hints. New RLS also intentionally restricts old public profile/roommate reads. Do not apply the schema while an older public application is serving unchecked. Rehearse in staging with a masked production clone, inspect `pg_policies`, constraints, service provider columns, trigger names and function ownership. Split expansion and restrictive policies into separate migrations if zero-downtime rollout is required.

1. Take a verified backup/PITR restore point. Record row counts and existing policies. Test restore in staging.
2. Keep housing intake, notifications, services, analytics and retention flags false. Prepare the matching application build.
3. Use a maintenance window or staged expansion/restriction sequence. Apply through Supabase migration tooling, reload PostgREST, deploy the matching build, then run the smoke tests.
4. Review actual inventory in the admin queue. Existing inventory is deliberately not assumed fresh, fees-complete or physically inspected. Unreviewed rows may disappear from public discovery.
5. Enable intake only with operator access and support coverage. Enable operational email only after provider/domain and delivery/retry tests. Set CRON_SECRET and verify the scheduled route; no client secret.
6. Enable services only after at least three eligible suppliers per displayed category and operational/legal review. Leave retention off until approved durations and deletion procedures exist.
7. Verify www redirects, preview noindex, consent copy, support channel, metadata, sitemap and real request authorization. Observe errors and payment fulfilment states.

All environment names and defaults are in `.env.example`; never commit values. `HOUSING_REQUEST_HASH_KEY` must be a strong server secret, different from payment/service credentials. No production keys are required by the isolated test runner.

## Rollback

Disable new workflow flags first; pause cron notifications. Preserve lead/audit/outbox records and outstanding payment orders. If application rollback is needed, keep the new privacy restrictions and deploy a compatible previous UI or maintenance page: blindly restoring the old app breaks joins and can expose formerly public PII. Do not drop new tables or remove payment claim protection while retries are pending. For schema reversal use the staging-tested backup/PITR plan and account for writes since the restore point. Destructive rollback SQL is intentionally not automated.

## Operational first build / monetization proposal

Start with accurate UNIPORT supply and timely, useful connection requests. Track qualified requests, actual connections and consented reported outcomes for two weeks. A fair first revenue experiment is an opt-in advertiser subscription for request-management tools or a clearly disclosed qualified-lead package with duplicate/refund rules. Keep students' basic requests free during validation. Agree price, allocation fairness, advertiser consent and refund/dispute terms before implementing charges. Sponsored listings must remain labelled and pass the same truth/freshness gates.

Daily: review new/unassigned requests, reports and expiring availability. Weekly: sample fees and evidence, inspect duplicate candidates, review connected/request and reported-outcome counts with explicit denominators. No public response time or safety guarantee.

## Main integration

Integrated maintenance fixes from main commit `5fbba2e`. The developer maintenance bypass now requires a configured `DEV_BYPASS_SECRET`; there is no public fallback secret and a literal `true` cookie does not bypass maintenance. The cookie is HTTP-only and secure in production. Admin/landlord authorization remains independent of the maintenance bypass.
