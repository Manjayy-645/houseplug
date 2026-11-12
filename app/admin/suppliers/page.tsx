import { requestActor } from "@/lib/request-auth";
import { redirect } from "next/navigation";
import { SupplierVetting } from "@/components/supplier-vetting";
export default async function Page() {
  const a = await requestActor();
  if (!a?.admin) redirect("/login");
  const { data } = await a.db
    .from("service_providers")
    .select("id,business_name,category")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <main className="space-y-5">
      <h1 className="text-3xl font-bold">Supplier vetting</h1>
      <p>
        Payment does not establish vetting. Gas/electrical and other high-risk
        services need applicable independent compliance checks and complaint
        support.
      </p>
      {(data ?? []).map((s) => (
        <SupplierVetting
          key={s.id}
          id={s.id}
          name={`${s.business_name} · ${s.category}`}
        />
      ))}
    </main>
  );
}
