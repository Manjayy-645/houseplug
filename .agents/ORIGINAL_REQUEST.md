# Original User Request

## 2026-08-19T17:26:04Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Small, focused team

Implement a compulsory 1000 Naira payment (success fee) with a pleading message when a landlord or agent successfully rents an apartment and marks it as unavailable.

This is a single self-contained fix; keep it small and focused.

Working directory: C:\Users\HP\Desktop\NESST
Integrity mode: benchmark

## Requirements

### R1. Payment Modal
When a landlord clicks "Mark Unavailable" on an active listing, intercept the action and show a popup modal. The modal must contain the exact text: "Please pay ₦1000 to mark this listing as rented. Your contribution helps keep HousePlug running!" and a "Pay with Paystack" button. The user must not be able to mark it unavailable without paying.

### R2. Paystack Integration
Clicking "Pay with Paystack" should initiate a transaction for 1000 Naira (100,000 kobo) using the existing Paystack integration. 

### R3. Status Update and Redirect
Upon successful payment, the backend (webhook or callback) must automatically update the listing's status to `unavailable`. The user should be redirected back to the landlord dashboard with a URL parameter indicating success (e.g., `?success_fee=paid`).

### R4. Success Banner
If the landlord dashboard is loaded with the success parameter, display a celebratory banner at the top of the dashboard confirming the property was marked as rented.

## Acceptance Criteria

### Functionality Verification
- [ ] An agent-as-judge or script verifies that the "Mark Unavailable" button opens the payment modal instead of instantly updating the status.
- [ ] An agent-as-judge or script verifies that simulating a successful Paystack transaction for this fee correctly updates the target listing's status to `unavailable` in the database.
- [ ] An agent-as-judge or script verifies that navigating to the dashboard with the success URL parameter renders the celebratory banner.
