import { safeReturnTo } from "@/lib/site";
export function redirectByRole(role?: string) {
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get("returnTo");

  if (returnTo) {
    window.location.href = safeReturnTo(returnTo);
    return;
  }

  let target = "/browse";
  switch (role) {
    case "super_admin":
    case "admin":
      target = "/admin/listings";
      break;
    case "landlord":
    case "agent":
      target = "/landlord/dashboard";
      break;
    default:
      target = "/browse";
  }

  window.location.href = target;
}
