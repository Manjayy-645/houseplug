export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient, getAdminClient } from "@/lib/supabase/server";
import { getAdminHousingRequests } from "@/app/actions/housing-requests";
import { AdminRequestsBoard } from "@/components/admin/admin-requests-board";

export const metadata = {
  title: "Housing Requests Board | HousePlug Admin",
  robots: { index: false, follow: false },
};

export default async function AdminRequestsPage() {
  const supabase = createClient();
  const db = getAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["admin", "super_admin"].includes(profile?.role || "")) {
    redirect("/");
  }

  const { requests } = await getAdminHousingRequests();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <AdminRequestsBoard initialRequests={requests} />
    </div>
  );
}
