import { redirect } from "next/navigation"

// /landlord/listings has no index page — the actual listing management is
// on the dashboard. Email notification links point here, so redirect them.
export default function LandlordListingsIndexPage() {
  redirect("/landlord/dashboard")
}
