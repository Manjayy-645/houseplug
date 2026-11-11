import { ReportForm } from "@/components/report-form";
export const metadata = {
  title: "Report a concern",
  robots: { index: false, follow: false },
};
export default function Page({
  searchParams,
}: {
  searchParams: { listing?: string };
}) {
  return (
    <main className="max-w-2xl mx-auto px-4 pt-28 pb-12 space-y-5">
      <h1 className="text-3xl font-bold">Report a listing or safety concern</h1>
      <p>
        Sign in to send a private report to HousePlug. For immediate danger,
        contact local emergency services.
      </p>
      <ReportForm listing={searchParams.listing} />
    </main>
  );
}
