import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { StudentNav } from "@/components/student/student-nav";
import { StudentSidebar } from "@/components/student/student-sidebar";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: "Student Dashboard | HousePlug",
};

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, savedRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single(),
    supabase
      .from("saved_listings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const profile = profileRes.data;
  const savedCount = savedRes.count ?? 0;

  if (!profile) redirect("/login");
  if (profile.banned || profile.is_banned) redirect("/banned");

  // Non-students go to their own dashboard
  if (profile.role === "landlord" || profile.role === "agent") {
    redirect("/landlord/dashboard");
  }
  if (profile.role === "admin" || profile.role === "super_admin") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 lg:flex">
      <StudentSidebar profile={profile} savedCount={savedCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <StudentNav profile={profile} />
        <main className="flex-1 pb-24 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
