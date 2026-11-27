import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ListingJsonLd } from "../components/seo/json-ld";

const listing = {
  id: "20000000-0000-4000-8000-000000000001",
  title: "Example room",
  priceYearly: 250000,
  priceBasis: "per_room" as const,
  roomType: "Self-contained",
  address: "Choba",
  area: "Choba",
  university: "UniPort",
  state: "Rivers State",
};

test("listing structured data omits an unconfirmed annual offer", () => {
  const markup = renderToStaticMarkup(
    React.createElement(ListingJsonLd, { ...listing, showAnnualOffer: false }),
  );
  const schema = JSON.parse(markup.replace(/^<script[^>]*>|<\/script>$/g, ""));
  assert.equal(schema["@type"], "Accommodation");
  assert.equal(schema.address.addressRegion, "Rivers State");
  assert.equal(schema.offers, undefined);
  assert.equal(markup.includes("08087654321"), false);
});

test("confirmed annual room rent uses an explicit unit and campus state", () => {
  const markup = renderToStaticMarkup(
    React.createElement(ListingJsonLd, { ...listing, state: "Lagos State", showAnnualOffer: true }),
  );
  const schema = JSON.parse(markup.replace(/^<script[^>]*>|<\/script>$/g, ""));
  assert.equal(schema.address.addressRegion, "Lagos State");
  assert.equal(schema.offers.price, 250000);
  assert.equal(schema.offers.priceSpecification.unitText, "per room per year");
});
