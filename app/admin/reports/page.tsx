import { requestActor } from "@/lib/request-auth";
import { redirect } from "next/navigation";
import { ReportResolution } from "@/components/report-resolution";
export default async function Page() {
  const a = await requestActor();
  if (!a?.admin) redirect("/login");
  const { data } = await a.db
    .from("reports")
    .select("id,category,description,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <main className="space-y-4">
      <h1 className="text-3xl font-bold">
        Private safety and authenticity reports
      </h1>
      {!data?.length ? (
        <p>No reports.</p>
      ) : (
        data.map((d) => (
          <article className="rounded-xl border bg-white p-5" key={d.id}>
            <h2 className="font-bold">
              {d.category} · {d.status}
            </h2>
            <p className="whitespace-pre-wrap">{d.description}</p>
            <ReportResolution id={d.id} />
          </article>
        ))
      )}
    </main>
  );
}
