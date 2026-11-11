import { ContentEditor } from "@/components/content-editor";
import { requestActor } from "@/lib/request-auth";
import { redirect } from "next/navigation";
export default async function Page() {
  const a = await requestActor();
  if (!a?.admin) redirect("/login");
  return (
    <main className="space-y-5">
      <h1 className="text-3xl font-bold">Editorial guides</h1>
      <ContentEditor />
    </main>
  );
}
