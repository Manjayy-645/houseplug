"use server";

import { revalidatePath } from "next/cache";
import { createClient, getAdminClient } from "@/lib/supabase/server";
import {
  studentHousingRequestSchema,
  generateRequestCode,
  type StudentHousingRequestInput,
} from "@/lib/housing-request-schema";
import type { HousingRequest, HousingRequestStatus } from "@/types";

/**
 * Verifies if the currently authenticated user has admin privileges.
 */
async function checkIsAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { isAdmin: false };

    const db = getAdminClient();
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "super_admin"].includes(profile?.role || "");
    return { isAdmin, userId: user.id };
  } catch {
    return { isAdmin: false };
  }
}

/**
 * 100% Free submission for students to post a lodge request.
 * Saves to housing_requests table in Supabase.
 */
export async function submitHousingRequest(input: StudentHousingRequestInput | FormData) {
  try {
    let rawData: Record<string, any> = {};

    if (input instanceof FormData) {
      input.forEach((value, key) => {
        rawData[key] = value;
      });
    } else {
      rawData = { ...input };
    }

    const validation = studentHousingRequestSchema.safeParse(rawData);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid form data";
      return { success: false, error: firstError };
    }

    const data = validation.data;
    const requestCode = generateRequestCode();
    const db = getAdminClient();

    const { data: inserted, error } = await db
      .from("housing_requests")
      .insert({
        request_code: requestCode,
        student_name: data.student_name,
        student_whatsapp: data.student_whatsapp,
        campus_zone: data.campus_zone,
        property_type: data.property_type,
        min_budget: data.min_budget,
        max_budget: data.max_budget,
        move_in_timeline: data.move_in_timeline,
        extra_notes: data.extra_notes?.trim() || null,
        status: "open",
      })
      .select("id, request_code")
      .single();

    if (error) {
      console.error("[housing-requests] Insert error:", error);
      return {
        success: false,
        error: "Failed to submit request. Please try again.",
      };
    }

    revalidatePath("/requests");
    revalidatePath("/admin/requests");
    revalidatePath("/browse");

    return {
      success: true,
      request_code: inserted?.request_code || requestCode,
      id: inserted?.id,
    };
  } catch (err: any) {
    console.error("[housing-requests] Submit exception:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred. Please try again.",
    };
  }
}

export type OpenRequestFilters = {
  campus_zone?: string;
  property_type?: string;
  move_in_timeline?: string;
  search?: string;
};

/**
 * Fetches open housing requests for the public student request board.
 * Note: student_whatsapp is deliberately excluded to protect student privacy.
 */
export async function getOpenHousingRequests(
  filters: OpenRequestFilters = {}
): Promise<{ requests: HousingRequest[]; error?: string }> {
  try {
    const db = getAdminClient();

    let query = db
      .from("housing_requests")
      .select(
        "id, request_code, student_name, campus_zone, property_type, min_budget, max_budget, move_in_timeline, extra_notes, status, created_at"
      )
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (filters.campus_zone && filters.campus_zone !== "all") {
      query = query.eq("campus_zone", filters.campus_zone);
    }

    if (filters.property_type && filters.property_type !== "all") {
      query = query.eq("property_type", filters.property_type);
    }

    if (filters.move_in_timeline && filters.move_in_timeline !== "all") {
      query = query.eq("move_in_timeline", filters.move_in_timeline);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[housing-requests] fetch open error:", error);
      return { requests: [], error: error.message };
    }

    let results = (data || []) as HousingRequest[];

    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      results = results.filter((r) => {
        return (
          r.request_code.toLowerCase().includes(q) ||
          r.campus_zone.toLowerCase().includes(q) ||
          r.property_type.toLowerCase().includes(q) ||
          (r.extra_notes && r.extra_notes.toLowerCase().includes(q))
        );
      });
    }

    return { requests: results };
  } catch (err: any) {
    console.error("[housing-requests] fetch open exception:", err);
    return { requests: [], error: err?.message || "Failed to load requests" };
  }
}

export type AdminRequestFilters = {
  status?: string;
  campus_zone?: string;
  property_type?: string;
  search?: string;
};

/**
 * Fetches all housing requests for the Admin Dashboard, including student_whatsapp.
 * Requires admin privileges.
 */
export async function getAdminHousingRequests(
  filters: AdminRequestFilters = {}
): Promise<{ requests: HousingRequest[]; error?: string }> {
  const { isAdmin } = await checkIsAdmin();
  if (!isAdmin) {
    return { requests: [], error: "Unauthorized access" };
  }

  try {
    const db = getAdminClient();

    let query = db
      .from("housing_requests")
      .select(
        "id, request_code, student_name, student_whatsapp, campus_zone, property_type, min_budget, max_budget, move_in_timeline, extra_notes, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.campus_zone && filters.campus_zone !== "all") {
      query = query.eq("campus_zone", filters.campus_zone);
    }

    if (filters.property_type && filters.property_type !== "all") {
      query = query.eq("property_type", filters.property_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[housing-requests] fetch admin error:", error);
      return { requests: [], error: error.message };
    }

    let results = (data || []) as HousingRequest[];

    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      results = results.filter((r) => {
        return (
          r.request_code.toLowerCase().includes(q) ||
          r.student_name.toLowerCase().includes(q) ||
          (r.student_whatsapp && r.student_whatsapp.toLowerCase().includes(q)) ||
          r.campus_zone.toLowerCase().includes(q) ||
          r.property_type.toLowerCase().includes(q) ||
          (r.extra_notes && r.extra_notes.toLowerCase().includes(q))
        );
      });
    }

    return { requests: results };
  } catch (err: any) {
    console.error("[housing-requests] fetch admin exception:", err);
    return { requests: [], error: err?.message || "Failed to load requests" };
  }
}

/**
 * Admin action to mark a housing request as fulfilled or reopen it.
 */
export async function updateHousingRequestStatus(
  id: string,
  status: HousingRequestStatus
) {
  const { isAdmin } = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const db = getAdminClient();
    const { error } = await db
      .from("housing_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/requests");
    revalidatePath("/requests");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Update failed" };
  }
}

/**
 * Admin action to delete a housing request.
 */
export async function deleteHousingRequest(id: string) {
  const { isAdmin } = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const db = getAdminClient();
    const { error } = await db.from("housing_requests").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/requests");
    revalidatePath("/requests");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Delete failed" };
  }
}
