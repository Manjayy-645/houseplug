import "server-only";
import { guides } from "@/lib/guides";
import { createServiceClient } from "@/lib/supabase/server";
export async function publishedGuide(
  slug: string,
): Promise<{
  title: string;
  description: string;
  author: string;
  updated: string;
  sections: { title: string; body: string }[];
} | null> {
  if (guides[slug])
    return { ...guides[slug], author: "HousePlug", updated: "2026-11-11" };
  const { data } = await createServiceClient()
    .from("content_pages")
    .select("title,body,author,updated_at")
    .eq("slug", slug)
    .not("reviewed_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .single();
  return data
    ? {
        title: data.title,
        description: data.body.slice(0, 150),
        author: data.author,
        updated: data.updated_at,
        sections: data.body
          .split(/\n\s*\n/)
          .map((body: string, i: number) => ({
            title: i === 0 ? "Guide" : "",
            body,
          })),
      }
    : null;
}
