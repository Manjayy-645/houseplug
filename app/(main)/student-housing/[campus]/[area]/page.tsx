import { CampusHub, neighbourhoods } from "@/components/campus-hub";
import { siteUrl } from "@/lib/site";
import { inventoryQuery } from "@/lib/public-inventory";
import { UNIVERSITIES } from "@/lib/constants";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: { campus: string; area?: string };
}) {
  const u = UNIVERSITIES.find((x) => x.id === params.campus);
  let q = inventoryQuery().eq("university", params.campus).limit(1);
  if (params.area) q = q.ilike("area", neighbourhoods[params.area] || "");
  const { data } = await q;
  return {
    title: `Student accommodation ${params.area ? `in ${neighbourhoods[params.area] || params.area}` : `near ${u?.shortName || params.campus}`}`,
    alternates: {
      canonical: siteUrl(
        `/student-housing/${params.campus}${params.area ? `/${params.area}` : ""}`,
      ),
    },
    robots: { index: !!data?.length, follow: true },
  };
}
export default function Page({
  params,
}: {
  params: { campus: string; area?: string };
}) {
  return <CampusHub campus={params.campus} area={params.area} />;
}
