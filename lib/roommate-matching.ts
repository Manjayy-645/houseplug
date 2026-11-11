import { formatNaira } from "./utils";
import { UNIVERSITIES } from "./constants";

export interface MinimalRoommateProfile {
  id?: string;
  university: string;
  budget_min: number;
  budget_max: number;
  gender: string;
  preferred_gender: string;
  lifestyle_tags?: string[] | null;
  bio?: string | null;
  target_listing_id?: string | null;
  target_listing_title?: string | null;
  room_address?: string | null;
}

export interface MatchScoreResult {
  score: number;
  isEligible: boolean;
  reasons: string[];
  budgetScore: number;
  lifestyleScore: number;
  lodgeScore: number;
}

/**
 * Normalizes phone number to Nigerian format: 234XXXXXXXXXX
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    return "234" + cleaned.substring(1);
  }
  if (!cleaned.startsWith("234") && cleaned.length === 10) {
    return "234" + cleaned;
  }
  return cleaned;
}

/**
 * Checks if two university strings refer to the same university
 */
export function areUniversitiesEqual(uniA: string, uniB: string): boolean {
  if (!uniA || !uniB) return false;
  const a = uniA.toLowerCase().trim();
  const b = uniB.toLowerCase().trim();
  if (a === b) return true;

  const objA = UNIVERSITIES.find(
    (u) =>
      u.id.toLowerCase() === a ||
      u.shortName.toLowerCase() === a ||
      u.name.toLowerCase() === a,
  );
  const objB = UNIVERSITIES.find(
    (u) =>
      u.id.toLowerCase() === b ||
      u.shortName.toLowerCase() === b ||
      u.name.toLowerCase() === b,
  );

  if (objA && objB && objA.id === objB.id) return true;
  return false;
}

/**
 * Checks mutual gender preference compatibility
 */
export function areGendersCompatible(
  myGender: string,
  myPreferred: string,
  theirGender: string,
  theirPreferred: string,
): boolean {
  const normMyPref = (myPreferred || "Any").toLowerCase();
  const normTheirPref = (theirPreferred || "Any").toLowerCase();
  const normMyGender = (myGender || "").toLowerCase();
  const normTheirGender = (theirGender || "").toLowerCase();

  const theyWantMe =
    normTheirPref === "any" ||
    (normTheirPref === "male only" && normMyGender === "male") ||
    (normTheirPref === "female only" && normMyGender === "female");

  const iWantThem =
    normMyPref === "any" ||
    (normMyPref === "male only" && normTheirGender === "male") ||
    (normMyPref === "female only" && normTheirGender === "female");

  return theyWantMe && iWantThem;
}

/**
 * Evaluates whether a candidate roommate's budget accommodates a specific lodge split price
 */
export function isBudgetCompatibleWithLodge(
  budgetMin: number,
  budgetMax: number,
  splitPrice: number,
): { compatible: boolean; isExact: boolean; label: string } {
  if (!budgetMin || !budgetMax || !splitPrice) {
    return { compatible: false, isExact: false, label: "Budget unavailable" };
  }

  // Exact match: falls right inside their range
  if (splitPrice >= budgetMin && splitPrice <= budgetMax) {
    return {
      compatible: true,
      isExact: true,
      label: `Fits budget (${formatNaira(budgetMin)} – ${formatNaira(budgetMax)})`,
    };
  }

  // Close match (within 15% tolerance)
  const tolerance = splitPrice * 0.15;
  if (
    splitPrice >= budgetMin - tolerance &&
    splitPrice <= budgetMax + tolerance
  ) {
    return {
      compatible: true,
      isExact: false,
      label: `Close to budget (${formatNaira(budgetMin)} – ${formatNaira(budgetMax)})`,
    };
  }

  return {
    compatible: false,
    isExact: false,
    label: `Budget: ${formatNaira(budgetMin)} – ${formatNaira(budgetMax)}`,
  };
}

/**
 * Comprehensive Match Score Algorithm (0-100)
 * - Hard filter: Same University + Mutual Gender preference (Must pass, otherwise 0)
 * - Budget Overlap (40%)
 * - Lifestyle Tags Overlap (30%)
 * - Target Lodge or Area Interest (30%)
 */
export function computeComprehensiveMatchScore(
  me: MinimalRoommateProfile,
  candidate: MinimalRoommateProfile,
  targetListing?: {
    id: string;
    title: string;
    area?: string;
    price_yearly?: number;
  },
): MatchScoreResult {
  const reasons: string[] = [];

  // 1. Hard Filter: University
  if (!areUniversitiesEqual(me.university, candidate.university)) {
    return {
      score: 0,
      isEligible: false,
      reasons: ["Different university"],
      budgetScore: 0,
      lifestyleScore: 0,
      lodgeScore: 0,
    };
  }

  // 2. Hard Filter: Mutual Gender Preference
  if (
    !areGendersCompatible(
      me.gender,
      me.preferred_gender,
      candidate.gender,
      candidate.preferred_gender,
    )
  ) {
    return {
      score: 0,
      isEligible: false,
      reasons: ["Gender preference does not match"],
      budgetScore: 0,
      lifestyleScore: 0,
      lodgeScore: 0,
    };
  }

  reasons.push("Same campus & compatible gender preference");

  // 3. Budget Overlap (0 - 40 points)
  let budgetScore = 0;
  const overlapMin = Math.max(me.budget_min, candidate.budget_min);
  const overlapMax = Math.min(me.budget_max, candidate.budget_max);
  if (overlapMax >= overlapMin) {
    const myRange = Math.max(1, me.budget_max - me.budget_min);
    const overlapSize = overlapMax - overlapMin;
    const ratio = Math.min(1, overlapSize / myRange);
    budgetScore = Math.round(25 + ratio * 15); // At least 25 points for having any overlap, up to 40
    reasons.push("Overlapping budget range");
  } else {
    // Gap penalty
    const gap = overlapMin - overlapMax;
    if (gap <= 30000) {
      budgetScore = 15; // Close enough
    }
  }

  // 4. Lifestyle Tags Overlap (0 - 30 points)
  let lifestyleScore = 0;
  const myTags = new Set(
    (me.lifestyle_tags || []).map((t) => t.toLowerCase().trim()),
  );
  const theirTags = (candidate.lifestyle_tags || []).map((t) =>
    t.toLowerCase().trim(),
  );
  if (myTags.size > 0 && theirTags.length > 0) {
    const shared = theirTags.filter((t) => myTags.has(t));
    const ratio = shared.length / Math.min(myTags.size, theirTags.length);
    lifestyleScore = Math.round(ratio * 30);
    if (shared.length > 0) {
      reasons.push(`${shared.length} shared lifestyle habits`);
    }
  } else {
    // Neutral fallback if tags aren't specified
    lifestyleScore = 15;
  }

  // 5. Target Lodge / Area Score (0 - 30 points)
  let lodgeScore = 10; // Baseline for same university area
  if (targetListing) {
    // If we're evaluating in context of a specific listing
    if (candidate.target_listing_id === targetListing.id) {
      lodgeScore = 30;
      reasons.push(`Also interested in ${targetListing.title}!`);
    } else if (
      candidate.target_listing_title &&
      candidate.target_listing_title
        .toLowerCase()
        .includes(targetListing.title.toLowerCase())
    ) {
      lodgeScore = 30;
      reasons.push(`Also interested in ${targetListing.title}!`);
    } else if (
      targetListing.area &&
      candidate.room_address &&
      candidate.room_address
        .toLowerCase()
        .includes(targetListing.area.toLowerCase())
    ) {
      lodgeScore = 22;
      reasons.push(`Looking in the same area (${targetListing.area})`);
    }
  } else {
    // Comparing two profiles generally
    if (
      me.target_listing_id &&
      candidate.target_listing_id &&
      me.target_listing_id === candidate.target_listing_id
    ) {
      lodgeScore = 30;
      reasons.push("Interested in splitting the exact same lodge!");
    } else if (
      me.target_listing_title &&
      candidate.target_listing_title &&
      me.target_listing_title.toLowerCase() ===
        candidate.target_listing_title.toLowerCase()
    ) {
      lodgeScore = 30;
      reasons.push("Targeting the same lodge!");
    } else if (
      me.room_address &&
      candidate.room_address &&
      me.room_address
        .toLowerCase()
        .includes(candidate.room_address.toLowerCase())
    ) {
      lodgeScore = 20;
      reasons.push("Preferred housing locations align");
    }
  }

  const totalScore = Math.min(
    100,
    Math.max(10, budgetScore + lifestyleScore + lodgeScore),
  );

  return {
    score: totalScore,
    isEligible: true,
    reasons,
    budgetScore,
    lifestyleScore,
    lodgeScore,
  };
}

/**
 * Builds pre-filled WhatsApp link for connecting about a specific listing
 */
export function buildLodgeRoommateWhatsAppLink(params: {
  phone: string;
  candidateName: string;
  listingTitle: string;
  listingArea: string;
  campusName: string;
  listingId: string;
  splitPrice: number;
  splitCount: number;
}): string {
  const {
    phone,
    candidateName,
    listingTitle,
    listingArea,
    campusName,
    listingId,
    splitPrice,
    splitCount,
  } = params;

  const targetPhone = formatWhatsAppPhone(phone);
  const firstName = candidateName ? candidateName.split(" ")[0] : "there";
  const formattedSplit = formatNaira(splitPrice);
  const listingUrl = `https://houseplug.ng/listing/${listingId}`;

  const message = `Hi ${firstName}, I saw your roommate profile on HousePlug! I found "${listingTitle}" in ${listingArea} near ${campusName}. Total rent splits to ${formattedSplit}/year each (${splitCount} people) which fits nicely! Check out the lodge here: ${listingUrl} — Would you be interested in teaming up?`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds pre-filled WhatsApp link for connecting generally on /roommates
 */
export function buildGeneralRoommateWhatsAppLink(params: {
  phone: string;
  candidateName: string;
  targetLodgeTitle?: string | null;
  targetLodgeId?: string | null;
  campusName?: string;
  budgetRange?: string;
}): string {
  const { phone, candidateName, targetLodgeTitle, targetLodgeId, campusName } =
    params;
  const targetPhone = formatWhatsAppPhone(phone);
  const firstName = candidateName ? candidateName.split(" ")[0] : "there";

  let message = "";
  if (targetLodgeTitle) {
    const listingUrl = targetLodgeId
      ? ` (https://houseplug.ng/listing/${targetLodgeId})`
      : "";
    message = `Hi ${firstName}, I saw on HousePlug that you're looking to split "${targetLodgeTitle}"${listingUrl}! I'm also looking for a roommate near ${campusName || "campus"} and would love to team up. Let's discuss!`;
  } else {
    message = `Hi ${firstName}, I saw your roommate profile on HousePlug near ${campusName || "campus"} and think we'd make great roommates! Are you still looking for someone to team up with?`;
  }

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}
