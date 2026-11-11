import Link from "next/link";
import { HousingMatchForm } from "@/components/housing-match-form";
import { requestActor } from "@/lib/request-auth";
import { RequestStatusActions } from "@/components/request-status-actions";
import { redirect } from "next/navigation";
export async function HousingInbox({
  mode,
}: {
  mode: "admin" | "agent" | "student";
}) {
  const actor = await requestActor();
  if (!actor) redirect("/login");
  if (mode === "admin" && !actor.admin) redirect("/browse");
  let q = actor.db
    .from("housing_requests")
    .select(
      "id,reference,university,area,total_budget,move_in_date,status,contact_name,contact_phone,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (!actor.admin || mode !== "admin")
    q = q.eq(mode === "agent" ? "assigned_agent_id" : "user_id", actor.id);
  const { data: errorAgents } =
    mode === "admin"
      ? await actor.db
          .from("profiles")
          .select("id,full_name")
          .in("role", ["landlord", "agent"])
          .eq("banned", false)
      : { data: [] };
  const { data: matches } = await actor.db
    .from("housing_request_matches")
    .select("lead_id,listing_id")
    .is("archived_at", null);
  const { data, error } = await q;
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Housing requests</h1>
      <p>
        Optional assistance requests only. Students can contact each listing’s
        advertiser directly on WhatsApp without submitting a request or waiting
        for assignment. HousePlug does not read private WhatsApp conversations
        or confirm inspections.
      </p>
      {error ? (
        <p>Request inbox is not available yet.</p>
      ) : !data?.length ? (
        <p>No requests yet.</p>
      ) : (
        data.map((h) => (
          <article
            data-request-id={h.id}
            key={h.id}
            className="rounded-xl border bg-white p-5"
          >
            <h2 className="font-bold">
              {h.reference} · {h.status.replaceAll("_", " ")}
            </h2>
            <p>
              {h.university} · {h.area} · ₦
              {h.total_budget.toLocaleString("en-NG")} total budget
            </p>
            <p>Move-in: {h.move_in_date}</p>
            <p>
              {h.contact_name} · {h.contact_phone}
            </p>
            {matches
              ?.filter((m) => m.lead_id === h.id && m.listing_id)
              .map((m) => (
                <p key={m.listing_id}>
                  <Link className="underline" href={`/listing/${m.listing_id}`}>
                    View suggested room
                  </Link>
                </p>
              ))}
            {mode === "admin" &&
              ["qualified", "matching"].includes(h.status) && (
                <HousingMatchForm id={h.id} />
              )}{" "}
            {mode !== "student" ? (
              <RequestStatusActions
                id={h.id}
                status={h.status}
                agents={errorAgents ?? []}
              />
            ) : (
              <div>
                <RequestStatusActions id={h.id} status={h.status} requester />
                <p>
                  Contact HousePlug support with your reference to correct this
                  request.
                </p>
              </div>
            )}
          </article>
        ))
      )}
    </section>
  );
}
