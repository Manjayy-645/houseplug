import test from "node:test";
import assert from "node:assert/strict";
import {
  studentHousingRequestSchema,
  generateRequestCode,
  formatPartnerAgentBroadcastMessage,
  getAgentClaimWhatsAppUrl,
  getWhatsAppSendUrl,
  cleanWhatsAppNumber,
  getPartnerAgentsGroupUrl,
} from "../lib/housing-request-schema";

test("studentHousingRequestSchema validates valid Nigerian student request", () => {
  const validData = {
    student_name: "Chinedu Okafor",
    student_whatsapp: "08031234567",
    campus_zone: "Choba",
    property_type: "Self-Contain",
    min_budget: 250000,
    max_budget: 350000,
    move_in_timeline: "Within 2 Weeks",
    extra_notes: "Fenced compound, water running",
  };

  const result = studentHousingRequestSchema.safeParse(validData);
  assert.equal(result.success, true);
});

test("studentHousingRequestSchema rejects invalid phone numbers", () => {
  const invalidData = {
    student_name: "Chinedu",
    student_whatsapp: "12345", // invalid phone
    campus_zone: "Choba",
    property_type: "Self-Contain",
    min_budget: 200000,
    max_budget: 300000,
    move_in_timeline: "Urgent (Within 7 Days)",
  };

  const result = studentHousingRequestSchema.safeParse(invalidData);
  assert.equal(result.success, false);
});

test("studentHousingRequestSchema rejects max_budget less than min_budget", () => {
  const invalidBudgets = {
    student_name: "Chinedu",
    student_whatsapp: "08031234567",
    campus_zone: "Aluu",
    property_type: "1-Bedroom Flat",
    min_budget: 400000,
    max_budget: 250000, // lower than min
    move_in_timeline: "This Month",
  };

  const result = studentHousingRequestSchema.safeParse(invalidBudgets);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(
      result.error.issues.some((i) =>
        i.message.includes("Maximum budget must be greater than or equal to minimum budget")
      )
    );
  }
});

test("generateRequestCode formats code as HP-XXXX with 4 uppercase alphanumeric characters", () => {
  const code = generateRequestCode();
  assert.match(code, /^HP-[2-9A-Z]{4}$/);
});

test("cleanWhatsAppNumber converts 080... to 23480...", () => {
  assert.equal(cleanWhatsAppNumber("08012345678"), "2348012345678");
  assert.equal(cleanWhatsAppNumber("+2348012345678"), "2348012345678");
  assert.equal(cleanWhatsAppNumber("2348012345678"), "2348012345678");
});

test("formatPartnerAgentBroadcastMessage generates exact 1-Click WhatsApp Broadcast text", () => {
  const message = formatPartnerAgentBroadcastMessage({
    request_code: "HP-4F92",
    campus_zone: "Choba",
    property_type: "Self-Contain",
    min_budget: 250000,
    max_budget: 350000,
    move_in_timeline: "Urgent (Within 7 Days)",
    extra_notes: "Female only, fenced compound with borehole",
    adminWhatsapp: "2348012345678",
  });

  assert.ok(message.includes("🚨 *NEW STUDENT HOUSING REQUEST (#HP-4F92)* 🚨"));
  assert.ok(message.includes("📍 *Preferred Area:* Choba"));
  assert.ok(message.includes("🏠 *Property Type:* Self-Contain"));
  assert.ok(message.includes("💰 *Student's Budget:* ₦250,000 – ₦350,000 / year"));
  assert.ok(message.includes("📅 *Move-In Timeline:* Urgent (Within 7 Days)"));
  assert.ok(message.includes("📝 *Extra Notes:* Female only, fenced compound with borehole"));
  assert.ok(message.includes("*Got a matching vacant lodge?*"));
  assert.ok(message.includes("👉 *Click here to claim this lead & send photos:*"));
  assert.ok(
    message.includes(
      "https://wa.me/2348012345678?text=Hello%20HousePlug%20Admin!%20I%20have%20a%20matching%20vacant%20Self-Contain%20in%20Choba%20for%20Request%20%23HP-4F92."
    )
  );
  assert.ok(message.includes("🌐 *Or list your property free at:* https://www.houseplug.ng"));
});

test("formatPartnerAgentBroadcastMessage provides fallback for empty extra notes", () => {
  const message = formatPartnerAgentBroadcastMessage({
    request_code: "HP-8A11",
    campus_zone: "Aluu",
    property_type: "Single Room",
    min_budget: 150000,
    max_budget: 200000,
    move_in_timeline: "This Month",
    extra_notes: "",
    adminWhatsapp: "2348012345678",
  });

  assert.ok(message.includes("📝 *Extra Notes:* Neat, secure compound with water"));
});

test("getAgentClaimWhatsAppUrl deep-links to Admin WhatsApp with pre-filled message", () => {
  const url = getAgentClaimWhatsAppUrl("HP-3321", "Alakahia", "1-Bedroom Flat", "2348012345678");
  assert.ok(url.startsWith("https://wa.me/2348012345678?text="));
  assert.ok(url.includes("Request%20%23HP-3321"));
  assert.ok(url.includes("Alakahia"));
  assert.ok(url.includes("1-Bedroom%20Flat"));
});

test("getWhatsAppSendUrl generates direct WhatsApp send URL", () => {
  const sendUrl = getWhatsAppSendUrl("Hello World");
  assert.equal(sendUrl, "https://api.whatsapp.com/send?text=Hello%20World");
});

test("getPartnerAgentsGroupUrl returns the configured partner agents WhatsApp invite link", () => {
  const groupUrl = getPartnerAgentsGroupUrl();
  assert.equal(groupUrl, "https://chat.whatsapp.com/KmewWrx2i9hCgsTCHoPGgU");
});

