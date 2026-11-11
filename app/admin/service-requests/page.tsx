import { requestActor } from "@/lib/request-auth";
import { redirect } from "next/navigation";
export default async function Page() {
  const a = await requestActor();
  if (!a?.admin) redirect("/login");
  const { data } = await a.db
    .from("service_requests")
    .select("id,provider_id,description,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <main className="space-y-4">
      <h1 className="text-3xl font-bold">Service enquiries</h1>
      {(data ?? []).map((s) => (
        <article className="border rounded-xl p-5 bg-white" key={s.id}>
          <h2 className="font-bold">
            {s.status} · {s.id}
          </h2>
          <p>{s.description}</p>
        </article>
      ))}
    </main>
  );
}
