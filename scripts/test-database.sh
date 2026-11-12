#!/usr/bin/env bash
set -euo pipefail
# Disposable local container only. Never consumes a production DATABASE_URL.
container="houseplug-tests-${RANDOM}-${RANDOM}"
trap 'docker rm -f "$container" >/dev/null 2>&1 || true' EXIT
image="postgres:17-alpine@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac"
docker run -d --name "$container" -e POSTGRES_PASSWORD=local-test-only "$image" >/dev/null
for attempt in $(seq 1 30); do
 if docker exec "$container" pg_isready -U postgres >/dev/null 2>&1;then break;fi
 sleep 1
done
apply(){ docker exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 --single-transaction < "$1"; }
apply tests/fixtures/base-schema.sql
apply supabase/migrations/020_real_time_tracking.sql
apply supabase/migrations/20261111020101_houseplug_profile_and_internal_function_security.sql
apply tests/fixtures/legacy-listing.sql
apply supabase/migrations/20261111215630_housing_truth_and_conversion.sql
apply supabase/migrations/20261111215644_payment_fulfilment_recovery.sql
apply supabase/migrations/20261112164925_allow_legacy_assistance_requests.sql
docker exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/housing_truth_conversion.sql
docker exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/payment_fulfilment.sql
docker exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/service_listing.sql
