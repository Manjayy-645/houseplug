import { requestActor } from "@/lib/request-auth";
import { InventoryReviewForm } from "@/components/admin/inventory-review-form";
import type { Listing } from "@/types";
import { redirect } from "next/navigation";
export default async function Page() {
  const actor = await requestActor();
  if (!actor?.admin) redirect("/login");
  const { data } = await actor.db
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory truth review</h1>
      <p>
        Reconcile all costs, authority, media and availability before promoting
        a property. Historical values are not automatically confirmed.
      </p>
      {(data ?? []).map((l) => (
        <InventoryReviewForm key={l.id} listing={l as Listing} />
      ))}
    </main>
  );
}
