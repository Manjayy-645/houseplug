# Applied HousePlug SQL security patch

Repository validation: SQL assertions passed during application and permissions/counts were checked afterward. `npm run build` was attempted in the source snapshot but could not start (`next: not found`); dependencies were not installed. No application TSX/TS files changed.

Project: `houseplug` (`sgqypgffyuvszdlqcwst`). Migration recorded by Supabase: `20261111020101_houseplug_profile_and_internal_function_security`.

## Changes applied

- Revoked browser/PUBLIC TRUNCATE on existing public tables. RLS does not protect TRUNCATE.
- Email signup metadata can select only student, landlord or agent. Other metadata roles become student. Existing email/OAuth provisioning split and trial behavior retained.
- Added an invoker profile-write trigger. Browser callers cannot change protected role, identity ID/email, ban state, paid verification state or reviewer/timestamps, or self-approve verification. Paid pending resubmissions remain supported. Changing evidence while retaining verified status is blocked.
- OAuth service-client profile inserts cannot create privileged roles. Existing protected server UPDATE paths for staff promotion/verification remain available.
- Pinned search_path on the five previously flagged functions; revoked direct browser execution of internal signup/subscription-trigger/boost-expiry functions. Intentional stats RPCs and is_admin remain available for compatibility.
- Made university_requests_summary a security-invoker view; removed anonymous view/RPC access. Its SELECT policy and RPC support both admin and super_admin and still enforce RLS.

## Verification performed

Migration included transactional SQL assertions using synthetic users and role impersonation. All fixtures were rolled back before migration completion. Checks covered signup role sanitization, legitimate own-profile edits, blocked role/ban/payment/self-verification changes, successful paid resubmission, trusted service-role verification, protected verified evidence, denied non-admin demand summaries and allowed super-admin summaries.

Post-change: profile guard enabled, view security_invoker=true, no browser TRUNCATE grants, internal function permissions correct, no test users remaining. Counts unchanged: profiles 112, auth users 115, listings 71. No existing data backfill or cleanup performed.

Security advisor rerun: previous security-definer view ERROR and all five mutable-search-path warnings are absent. Remaining warnings: public pg_trgm extension placement, intentionally retained statistics/is_admin SECURITY DEFINER RPCs, and disabled leaked-password protection. Trial-registry no-policy findings intentionally retain service-only access; they were not opened to browser roles.

## Important limitations / deferred work

This is a bounded SQL security patch, not the entire transformation backlog. Live anonymous profile column grants already exclude contact/identity-document fields, unlike the incomplete repository-only picture. Authenticated landlord-profile reads and active roommate contact visibility still need coordinated private/public model and application changes. No claim of complete privacy hardening.

Fees, scoped property evidence, sharing eligibility, listing freshness, leads/inspections and payment fulfilment are not implemented by this migration. Their schemas and app consumers need coordinated migrations. No financial fee values or historic evidence/availability/occupancy facts were changed. This report was written immediately after the SQL migration. The accompanying repository commit records the hosted migration; it does not itself rerun the database migration.

## Recovery

The pre-change schema/ACL snapshot remains in the execution workspace for recovery. `supabase/migrations/20261111020101_houseplug_profile_and_internal_function_security.sql` records the applied SQL, including its original rolled-back fixture assertions. `supabase/tests/houseplug_profile_security.sql` contains the independently repeatable verification assertions. Run tests only with an authorized database administrator connection in a controlled transaction.

Prefer a reviewed forward migration. If profile editing regresses, inspect the blocked field and route first; preserve privilege protection and move the operation through its authorized server API. Emergency trigger removal alone is possible but reopens privilege escalation and is not an approved automatic rollback. Do not restore browser TRUNCATE or anonymous demand-view access. No financial/history data needs reversal.

Suggested next coordinated patch: separate minimal public profile/roommate projections from private contact/document reads, update app consumers and add cross-user RLS tests; then listing fee/sharing truth contracts.
