import { requestActor } from "@/lib/request-auth";
import { redirect } from "next/navigation";
import { currentAvailability, moveInTotal } from "@/lib/housing";
export const dynamic = "force-dynamic";
export default async function Page() {
  const a = await requestActor();
  if (!a?.admin) redirect("/login");
  const [{ data: leads }, { data: events }, { data: inventory }] =
    await Promise.all([
      a.db
        .from("housing_requests")
        .select("id,status,university,source,medium,campaign,created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      a.db
        .from("lead_events")
        .select("lead_id,next_status,created_at")
        .order("created_at", { ascending: false })
        .limit(10000),
      a.db
        .from("listings")
        .select(
          "id,landlord_id,status,price_yearly,fees_complete,fee_items,availability_state,last_confirmed_at,availability_expires_at,address,area,university,photos",
        )
        .limit(2000),
    ]);
  const stages = (stage: string) =>
    new Set(
      (events ?? [])
        .filter((e) => e.next_status === stage)
        .map((e) => e.lead_id),
    ).size;
  const submitted = leads?.length ?? 0;
  const qualified = stages("qualified"),
    connected = stages("connected"),
    rented = stages("rented");
  const active = (inventory ?? []).filter((l) => l.status === "active");
  const fresh = active.filter((l) => currentAvailability(l)).length;
  const complete = active.filter((l) => moveInTotal(l) !== null).length;
  const groups: Record<
    string,
    { submitted: number; qualified: number; connected: number }
  > = {};
  for (const l of leads ?? []) {
    const key = [
      l.university,
      l.source || "direct",
      l.campaign || "unattributed",
    ].join(" / ");
    groups[key] ??= { submitted: 0, qualified: 0, connected: 0 };
    groups[key].submitted++;
    if (
      (events ?? []).some(
        (e) => e.lead_id === l.id && e.next_status === "qualified",
      )
    )
      groups[key].qualified++;
    if (
      (events ?? []).some(
        (e) => e.lead_id === l.id && e.next_status === "connected",
      )
    )
      groups[key].connected++;
  }
  const properties = new Map<string, number>();
  for (const l of inventory ?? []) {
    const key = [l.university, l.area, l.address]
      .join("|")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    if (l.address) properties.set(key, (properties.get(key) ?? 0) + 1);
  }
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Housing request outcomes</h1>
      <p>
        Requests and reported connections are separate from WhatsApp clicks.
        HousePlug cannot read private WhatsApp conversations and does not
        schedule or certify inspections. Connections and rentals shown here are
        separately reported outcomes, not observations of WhatsApp activity.
      </p>
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          ["Submitted requests", submitted],
          ["Qualified requests", qualified],
          ["Reported connections", connected],
          ["Reported rental outcomes", rented],
        ].map(([t, n]) => (
          <article key={t} className="rounded-xl border bg-white p-5">
            <h2>{t}</h2>
            <p className="text-3xl font-bold">{n}</p>
          </article>
        ))}
      </div>
      <p>
        Qualification: {qualified}/{submitted} submitted requests. Connection:{" "}
        {connected}/{qualified} qualified requests. These are request cohorts,
        not visit conversion rates.
      </p>
      <p>
        Fresh inventory: {fresh}/{active.length} active rows. Complete mandatory
        fees: {complete}/{active.length} active rows. Potential duplicate
        address groups: {[...properties.values()].filter((n) => n > 1).length};
        review before taking action.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full bg-white">
          <caption className="text-left py-3">
            Campus and acquisition source (up to 1,000 recent requests; stage
            history up to 10,000 events)
          </caption>
          <thead>
            <tr>
              {[
                "Campus / source / campaign",
                "Submitted",
                "Qualified",
                "Connected",
              ].map((t) => (
                <th key={t} className="p-3 text-left">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groups).map(([g, v]) => (
              <tr key={g}>
                <th className="p-3 text-left">{g}</th>
                <td>{v.submitted}</td>
                <td>{v.qualified}</td>
                <td>{v.connected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm">
        Outcomes are reports from the participants or administrators, not
        independently verified move-ins. GSC traffic and real-user performance
        are separate measurements.
      </p>
    </main>
  );
}
