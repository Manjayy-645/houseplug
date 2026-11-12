import { requestActor } from "@/lib/request-auth";
import { redirect } from "next/navigation";
import { ReferralForm } from "@/components/referral-form";
export default async function Page() {
  const a = await requestActor();
  if (!a?.admin) redirect("/login");
  const { data } = await a.db
    .from("referral_codes")
    .select("code,campaign,active,expires_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <main className="space-y-5">
      <h1 className="text-3xl font-bold">Referral pilot</h1>
      <ReferralForm />
      {(data ?? []).map((r) => (
        <p key={r.code}>
          {r.code} · {r.campaign} · {r.active ? "active" : "inactive"} · /r/
          {r.code}
        </p>
      ))}
    </main>
  );
}
