import { redirect } from "next/navigation"

export default function Page({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const query = searchParams.status ? `?status=${searchParams.status}` : ""
  redirect(`/admin/services${query}`)
}
