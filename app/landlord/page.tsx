import { redirect } from "next/navigation"

// /landlord has no index page — redirect to the dashboard.
// Without this, users typing /landlord or following stale links get a 404.
export default function LandlordIndexPage() {
  redirect("/landlord/dashboard")
}
