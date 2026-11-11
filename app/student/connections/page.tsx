import { requestActor } from "@/lib/request-auth";
import { ConnectionActions } from "@/components/connection-actions";
import { redirect } from "next/navigation";
export default async function Page() {
  const a = await requestActor();
  if (!a || a.role !== "student") redirect("/login");
  const { data } = await a.db
    .from("roommate_connections")
    .select("id,requester_id,recipient_id,status,created_at")
    .or(`requester_id.eq.${a.id},recipient_id.eq.${a.id}`)
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <main className="mx-auto max-w-3xl p-5 space-y-5">
      <h1 className="text-3xl font-bold">Private roommate connections</h1>
      <p>
        You can revoke sharing or block another student at any time.
        Already-shared contact details cannot be recalled from their device.
      </p>
      {!data?.length ? (
        <p>No connections yet.</p>
      ) : (
        data.map((c) => (
          <article key={c.id} className="rounded-xl border bg-white p-5">
            <h2 className="font-bold">
              {c.requester_id === a.id ? "Outgoing" : "Incoming"} request ·{" "}
              {c.status}
            </h2>
            <ConnectionActions
              target={c.requester_id === a.id ? c.recipient_id : c.requester_id}
              status={c.status}
              incoming={c.recipient_id === a.id}
            />
          </article>
        ))
      )}
    </main>
  );
}
