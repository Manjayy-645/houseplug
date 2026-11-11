import { publishedGuide } from "@/lib/published-guide";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guides } from "@/lib/guides";
import { siteUrl } from "@/lib/site";
export function generateStaticParams() {
  return Object.keys(guides).map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const g = await publishedGuide(params.slug);
  return g
    ? {
        title: g.title,
        description: g.description,
        alternates: { canonical: siteUrl(`/guides/${params.slug}`) },
      }
    : {};
}
export default async function Page({ params }: { params: { slug: string } }) {
  const g = await publishedGuide(params.slug);
  if (!g) notFound();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.description,
    dateModified: g.updated,
    author: { "@type": "Organization", name: g.author },
    mainEntityOfPage: siteUrl(`/guides/${params.slug}`),
  };
  return (
    <main className="max-w-3xl mx-auto px-4 pt-28 pb-16">
      <nav className="mb-6">
        <Link className="underline" href="/">
          Home
        </Link>{" "}
        / Housing guides
      </nav>
      <h1 className="text-3xl sm:text-4xl font-bold mb-4">{g.title}</h1>
      <p className="text-lg">{g.description}</p>
      <p className="text-sm text-gray-600 mt-3">
        {g.author} · Updated {new Date(g.updated).toLocaleDateString("en-NG")}
      </p>
      {g.sections.map((s, i) => (
        <section key={`${s.title}-${i}`} className="mt-8">
          {s.title && <h2 className="text-2xl font-bold mb-3">{s.title}</h2>}
          <p className="leading-relaxed">{s.body}</p>
        </section>
      ))}
      <div className="flex flex-wrap gap-5 mt-8">
        <Link href="/student-housing/uniport" className="underline py-3">
          Explore UNIPORT rooms
        </Link>
        <Link href="/housing-assistance" className="underline py-3">
          Request Housing Assistance
        </Link>
        <Link href="/safety" className="underline py-3">
          Safety Guide
        </Link>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
