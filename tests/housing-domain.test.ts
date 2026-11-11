import test from "node:test";
import assert from "node:assert/strict";
import {
  moveInTotal,
  sharingEligible,
  currentAvailability,
  promotionEligible,
  verificationLabels,
} from "../lib/housing";
import { areGendersCompatible } from "../lib/roommate-matching";
import { safeReturnTo, siteUrl } from "../lib/site";
import {
  leadTransitions,
  attributionToken,
  housingRequestSchema,
} from "../lib/request-schema";

test("unknown mandatory fees stay unknown; optional inspection excluded; refundable mandatory deposit included", () => {
  const base = {
    price_yearly: 250000,
    fees_complete: true,
    fee_items: [
      {
        type: "agency",
        label: "Agency",
        amount: 100000,
        mandatory: true,
        refundable: false,
      },
      {
        type: "caution",
        label: "Caution",
        amount: 50000,
        mandatory: true,
        refundable: true,
      },
      {
        type: "inspection",
        label: "Inspection",
        amount: 7000,
        mandatory: false,
        refundable: false,
      },
    ],
  };
  assert.equal(moveInTotal(base), 400000);
  assert.equal(
    moveInTotal({
      ...base,
      fee_items: [{ ...base.fee_items[0], amount: null }],
    }),
    null,
  );
  assert.equal(moveInTotal({ ...base, fees_complete: false }), null);
  assert.equal(
    moveInTotal({ ...base, fee_items: [{ ...base.fee_items[0], amount: 0 }] }),
    250000,
  );
});
test("one occupant or absent owner permission can never produce a split", () => {
  assert.equal(sharingEligible({ occupancy: 1, sharing_allowed: true }), false);
  assert.equal(sharingEligible({ occupancy: 3 }), false);
  assert.equal(
    sharingEligible({ occupancy: 2, sharing_allowed: true }, 3),
    false,
  );
  assert.equal(sharingEligible({ occupancy: 2, sharing_allowed: true }), false);
  assert.equal(sharingEligible({ occupancy: 2, sharing_allowed: true, price_basis: "per_bed", rent_term_months: 12 }), false);
  assert.equal(sharingEligible({ occupancy: 2, sharing_allowed: true, price_basis: "per_unit", rent_term_months: 11 }), false);
  assert.equal(sharingEligible({ occupancy: 2, sharing_allowed: true, price_basis: "per_unit", rent_term_months: 12 }), true);
});
test("freshness and scoped evidence govern promotion and badges", () => {
  const now = Date.parse("2026-11-11T12:00:00Z");
  const l = {
    status: "active",
    availability_state: "active",
    last_confirmed_at: "2026-11-10",
    availability_expires_at: "2026-11-20",
    price_yearly: 250000,
    fees_complete: true,
    media_confirmed_at: "2026-11-10",
    authority_checked_at: "2026-11-10",
    evidence_expires_at: "2027-01-01",
  };
  assert.equal(currentAvailability(l, now), true);
  assert.equal(
    currentAvailability({ ...l, availability_state: "rented" }, now),
    false,
  );
  assert.equal(
    currentAvailability({ ...l, availability_expires_at: "2026-11-01" }, now),
    false,
  );
  assert.equal(promotionEligible(l, now), true);
  assert.equal(promotionEligible({ ...l, fees_complete: false }, now), false);
  assert.deepEqual(verificationLabels(l, now), ["Authority to list checked"]);
  assert.deepEqual(
    verificationLabels({ ...l, evidence_expires_at: "2020-01-01" }, now),
    [],
  );
});
test("gender preference checks are exact and reciprocal", () => {
  assert.equal(
    areGendersCompatible("Male", "Any", "Female", "Female Only"),
    false,
  );
  assert.equal(
    areGendersCompatible("Female", "Female Only", "Female", "Any"),
    true,
  );
  assert.equal(
    areGendersCompatible("Female", "Male Only", "Male", "Female Only"),
    true,
  );
});
test("redirects and public identity cannot point at preview or attacker hosts", () => {
  for (const bad of [
    "//evil.example",
    "https://evil.example",
    "/\\evil.example",
    "/browse\nfoo",
  ])
    assert.equal(safeReturnTo(bad), "/browse");
  assert.equal(safeReturnTo("/student/requests"), "/student/requests");
  assert.equal(siteUrl("/browse"), "https://www.houseplug.ng/browse");
});
test("request stages do not manufacture appointments or convert clicks into qualified leads", () => {
  assert.deepEqual(leadTransitions.new, ["qualified", "spam", "cancelled"]);
  assert.equal(leadTransitions.new.includes("connected"), false);
  assert.equal(
    Object.keys(leadTransitions).some((s) => s.includes("inspection")),
    false,
  );
  assert.equal(attributionToken("person@example.com"), null);
  assert.equal(attributionToken("whatsapp_08012345678"), null);
  assert.equal(attributionToken("uniport_housing"), "uniport_housing");
});
test("request validation requires real consent and a future move-in date", () => {
  const v = {
    submission_key: "550e8400-e29b-41d4-a716-446655440000",
    university: "uniport",
    area: "Aluu",
    total_budget: 400000,
    move_in_date: "2099-01-01",
    contact_name: "Test Student",
    contact_phone: "08012345678",
    contact_consent: true,
  };
  assert.equal(housingRequestSchema.safeParse(v).success, true);
  assert.equal(
    housingRequestSchema.safeParse({ ...v, contact_consent: false }).success,
    false,
  );
  assert.equal(
    housingRequestSchema.safeParse({ ...v, move_in_date: "2020-01-01" })
      .success,
    false,
  );
  assert.equal(
    housingRequestSchema.safeParse({ ...v, website: "spam" }).success,
    false,
  );
});

import { assertPaymentMatches, paymentInput } from "../lib/payment-schema";
test("payment fulfilment requires the exact server-created order and NGN minor units", () => {
  const order = {
    amount: 500000,
    landlord_id: "owner",
    type: "subscription",
    plan: "pro",
  };
  const t = {
    amount: 500000,
    currency: "NGN",
    metadata: { landlord_id: "owner", type: "subscription", plan: "pro" },
  };
  assert.doesNotThrow(() => assertPaymentMatches(t, order));
  assert.throws(() => assertPaymentMatches({ ...t, amount: 5000 }, order));
  assert.throws(() => assertPaymentMatches({ ...t, currency: "USD" }, order));
  assert.throws(() =>
    assertPaymentMatches(
      { ...t, metadata: { ...t.metadata, landlord_id: "other" } },
      order,
    ),
  );
  assert.equal(
    paymentInput.safeParse({ type: "boost", boost_type: "pro_annual" }).success,
    false,
  );
});
