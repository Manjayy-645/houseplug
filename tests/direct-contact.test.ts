import test from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppLink } from "../lib/utils";
import { publicListing } from "../lib/public-listing";
import type { Listing } from "../types";

const id = "20000000-0000-4000-8000-000000000001";
test("direct WhatsApp message includes the property name, reference and canonical URL", () => {
  const url = new URL(buildWhatsAppLink("08012345678", "A & B / Aluu", id));
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/2348012345678");
  const message = url.searchParams.get("text")!;
  assert.ok(message.includes("A & B / Aluu"));
  assert.ok(message.includes(`Listing reference: ${id}`));
  assert.ok(message.includes(`https://www.houseplug.ng/listing/${id}`));
  assert.ok(
    !message.includes("booked") && !message.includes("confirmed inspection"),
  );
});
test("existing Nigerian local, international and spaced WhatsApp numbers work", () => {
  for (const phone of [
    "08012345678",
    "+234 801 234 5678",
    "2348012345678",
    "8012345678",
  ]) {
    assert.equal(
      new URL(buildWhatsAppLink(phone, "Room", id)).pathname,
      "/2348012345678",
    );
  }
});
test("a missing or invalid advertiser number never redirects students into a request workflow", () => {
  for (const phone of ["", "invalid", "1234", "00000000000"])
    assert.equal(buildWhatsAppLink(phone, "Room", id), "");
});
const row = {
  id,
  area: "Aluu",
  status: "active",
  availability_state: "active",
  last_confirmed_at: "2026-01-01T00:00:00Z",
  availability_expires_at: "2099-01-01T00:00:00Z",
  whatsapp_number: "08012345678",
  phone_number: "08012345678",
  landlord: {
    id: "agent",
    full_name: "Agent",
    role: "agent",
    phone: "08087654321",
    email: "private@example.invalid",
  },
} as Listing;
test("public contact uses only advertised listing numbers, without private account phone or email", () => {
  const result = publicListing(row);
  assert.equal(result.whatsapp_number, "08012345678");
  assert.equal(result.landlord?.phone, undefined);
  assert.equal(result.landlord?.email, undefined);
});
test("draft, rented, paused and expired public projections suppress advertiser contact", () => {
  for (const changes of [
    { status: "pending" },
    { status: "rented" },
    { availability_state: "paused" },
    { availability_expires_at: "2020-01-01T00:00:00Z" },
  ]) {
    const result = publicListing({ ...row, ...changes } as Listing);
    assert.equal(result.whatsapp_number, "");
    assert.equal(result.phone_number, "");
  }
});
