import { redirect } from "next/navigation"

// /student has no index page — redirect to the dashboard.
// Without this, users typing /student or following stale links get a 404.
export default function StudentIndexPage() {
  redirect("/student/dashboard")
}
