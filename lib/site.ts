// Public identity is independent from preview URLs and deployment environment values.
export const SITE_URL = "https://www.houseplug.ng";
export const siteUrl = (path = "") =>
  new URL(path || "/", SITE_URL)
    .toString()
    .replace(/\/$/, path === "/" ? "/" : "");
export function safeReturnTo(value?: string | null, fallback = "/browse") {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\r\n]/.test(value)
    ? value
    : fallback;
}

export function originMatchesHost(
  origin: string | null,
  host: string | null,
  protocol: string,
): boolean {
  if (!origin || !host) return false;
  try {
    const u = new URL(origin);
    return (
      ["http:", "https:"].includes(u.protocol) &&
      u.host === host &&
      u.protocol === protocol
    );
  } catch {
    return false;
  }
}
