# HousePlug direct WhatsApp product contract

Founder requirement, 11 November 2026. This supersedes conflicting inspection, scheduling and assignment requirements in the master brief or the original audit. PR #3 remains draft and must not be merged or deployed until this correction is reviewed.

## Primary journey

Student browses available rooms → selects a listing → **Chat With Agent on WhatsApp** → WhatsApp opens for that listing’s responsible advertiser. Student and agent independently discuss fees, availability and rental terms and arrange any inspection.

The contact action is an ordinary outbound link. It requires no login, housing request, platform-assigned agent, booking, payment or HousePlug approval. A tracking failure must not prevent it opening. The prefilled text includes the property name, explicit listing reference and canonical www.houseplug.ng listing URL. Opening WhatsApp does not send the message automatically.

An absent/invalid WhatsApp number produces an honest unavailable message; it never silently sends the student into a housing request or booking workflow. A separately advertised phone number remains a secondary contact option.

## Tracking and privacy

Legacy WhatsApp click counters and activity events are preserved. Optional funnel analytics record `whatsapp_click` as an intent event, deduplicated by anonymous session/listing/day. Raw clicks and unique daily session intent have different denominators. Neither proves that a message was sent or read, a genuine enquiry occurred, an inspection was arranged or attended, or a rental succeeded. Client attempts to submit confirmed-stage events are rejected.

HousePlug cannot read or monitor private WhatsApp conversations. No chat-content ingestion, WhatsApp messaging API, webhooks for private conversations or mandatory inspection engine is added. Optional assistance outcomes are manually reported and labelled accordingly.

Published, current listing contact fields are intended to be public so guests can use direct WhatsApp. They come from the advertiser’s listing, never from a private profile phone, email or verification document. Public projections suppress contacts on draft, paused, rented or expired inventory, including owner/admin previews. Hiding a displayed phone number behind a reveal button is a convenience, not an authorization boundary: a published wa.me link necessarily contains its destination number. Existing database/profile/roommate protections remain required.

## Optional assistance and feedback

Housing assistance remains a separate opt-in, feature-gated service for students who want help finding alternatives. It is a secondary listing link, labelled “Optional housing assistance.” Internal assistance routing is optional; it does not select or gate the advertiser for ordinary listing contact. Qualification, connection and rental updates relate only to submitted assistance requests and are not derived from WhatsApp clicks. No inspection-confirmation status is accepted.

This correction does not collect inspection feedback. Any future feedback must remain optional, lightweight, consent-based and clearly attributed as a report rather than independent confirmation. It cannot gate access to the advertiser.

## Change and verification map

| Requirement                                    | Implementation                                                                                                                                                         | Pre-merge evidence                                                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Exact primary CTA on desktop/mobile/sticky bar | components/listing/contact-card.tsx                                                                                                                                    | Browser opens mocked wa.me at 320, 375 and 1280px without a request or assignment                                   |
| Property name, reference, canonical URL        | lib/utils.ts                                                                                                                                                           | Unit message/encoding/number tests and decoded browser href assertions                                              |
| Clicks stay separate from confirmed activity   | Existing counters + components/funnel-beacon.tsx and /api/funnel-events                                                                                                | Browser checks counter increases, daily intent dedupe, unchanged requests/audit/outbox, rejected confirmed events   |
| No booking or assignment prerequisite          | Ordinary external links; optional assistance unchanged                                                                                                                 | Guest flow, tracking-outage test and optional assistance with no assigned agent                                     |
| Advertised vs private contacts                 | lib/public-listing.ts and existing listing eligibility                                                                                                                 | Unit projection checks; draft/expired/missing-contact browser cases; private profile number absent from public HTML |
| Accurate costs/freshness/scoped checks         | Existing fee/availability/evidence domain preserved; conflicting legacy “no agent fee” banner removed; missing available-from/furnishing/floor values stay unconfirmed | Existing unit, database and browse/detail regression tests                                                          |
| Honest analytics copy                          | Admin outcomes and landlord analytics                                                                                                                                  | Click-through wording; manual reports and conversation-privacy disclosure                                           |

Browser tests intercept wa.me and never contact an agent or send a WhatsApp message. No production database change, deployment, merge or new charge is part of this correction.
