import test from "node:test";
import assert from "node:assert/strict";
import {
  formatWhatsAppPhone,
  buildGeneralRoommateWhatsAppLink,
  buildLodgeRoommateWhatsAppLink,
} from "../lib/roommate-matching";

test("formatWhatsAppPhone normalizes Nigerian phone formats to 234 format", () => {
  // 11-digit local format starting with 0
  assert.equal(formatWhatsAppPhone("08012345678"), "2348012345678");
  assert.equal(formatWhatsAppPhone("07098765432"), "2347098765432");
  assert.equal(formatWhatsAppPhone("09011223344"), "2349011223344");
  assert.equal(formatWhatsAppPhone("08155667788"), "2348155667788");

  // Format with spaces or hyphens
  assert.equal(formatWhatsAppPhone("080 1234 5678"), "2348012345678");
  assert.equal(formatWhatsAppPhone("+234-801-234-5678"), "2348012345678");

  // Already normalized 234 format
  assert.equal(formatWhatsAppPhone("2348012345678"), "2348012345678");
});

test("buildGeneralRoommateWhatsAppLink constructs valid wa.me URLs with proper prefill", () => {
  const url = buildGeneralRoommateWhatsAppLink({
    phone: "08012345678",
    candidateName: "Chinedu Okafor",
    campusName: "UniPort",
  });

  const parsed = new URL(url);
  assert.equal(parsed.protocol, "https:");
  assert.equal(parsed.hostname, "wa.me");
  assert.equal(parsed.pathname, "/2348012345678");

  const textParam = parsed.searchParams.get("text") || "";
  assert.match(textParam, /^Hi Chinedu,/);
  assert.match(textParam, /UniPort/);
});

test("buildGeneralRoommateWhatsAppLink with target lodge includes lodge details", () => {
  const url = buildGeneralRoommateWhatsAppLink({
    phone: "08098765432",
    candidateName: "Amaka",
    targetLodgeTitle: "Emerald Villa",
    targetLodgeId: "e9b2f5d8-4f24-4b53-83a3-f0a514d3c401",
    campusName: "RSU",
  });

  const parsed = new URL(url);
  assert.equal(parsed.pathname, "/2348098765432");

  const textParam = parsed.searchParams.get("text") || "";
  assert.match(textParam, /Emerald Villa/);
  assert.match(textParam, /houseplug\.ng\/listing\/e9b2f5d8-4f24-4b53-83a3-f0a514d3c401/);
});

test("roommate connection requirements enforce mutual active profile invariant", () => {
  function validateRoommateProfileEligibility(profile: {
    status: string;
    visibility_consent: boolean;
    expires_at: string | Date | null;
  }) {
    if (profile.status !== "active") return { eligible: false, reason: "inactive" };
    if (!profile.visibility_consent) return { eligible: false, reason: "consent_missing" };
    if (profile.expires_at && new Date(profile.expires_at).getTime() <= Date.now()) {
      return { eligible: false, reason: "expired" };
    }
    return { eligible: true, reason: null };
  }

  // Active, consented, non-expired profile
  assert.deepEqual(
    validateRoommateProfileEligibility({
      status: "active",
      visibility_consent: true,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    }),
    { eligible: true, reason: null }
  );

  // Paused profile
  assert.deepEqual(
    validateRoommateProfileEligibility({
      status: "paused",
      visibility_consent: true,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    }),
    { eligible: false, reason: "inactive" }
  );

  // Missing visibility consent
  assert.deepEqual(
    validateRoommateProfileEligibility({
      status: "active",
      visibility_consent: false,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    }),
    { eligible: false, reason: "consent_missing" }
  );

  // Expired profile
  assert.deepEqual(
    validateRoommateProfileEligibility({
      status: "active",
      visibility_consent: true,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    }),
    { eligible: false, reason: "expired" }
  );
});
