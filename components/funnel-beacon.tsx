"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Counts intent only. Qualification and outcome stages come from server audit events.
export function FunnelTracker({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  useEffect(() => {
    if (!enabled) return;
    const emit = (event: string, listingId?: string, university?: string) => {
      try {
        let session = sessionStorage.getItem("houseplug-session");
        if (!session) {
          session = crypto.randomUUID();
          sessionStorage.setItem("houseplug-session", session);
        }
        navigator.sendBeacon(
          "/api/funnel-events",
          new Blob(
            [
              JSON.stringify({
                event,
                session_id: session,
                listing_id: listingId,
                university,
              }),
            ],
            { type: "application/json" },
          ),
        );
      } catch {
        /* Storage or telemetry being unavailable must not block discovery. */
      }
    };
    const listingId = pathname.match(/^\/listing\/([0-9a-f-]{36})$/)?.[1];
    if (listingId) emit("listing_view", listingId);
    const campus = pathname.match(/^\/student-housing\/([a-z_]+)/)?.[1];
    if (campus) emit("campus_view", undefined, campus);
    if (pathname === "/housing-assistance") emit("housing_request_started");
    if (pathname === "/browse" && window.location.search) emit("filter_apply");
    const submit = (e: Event) => {
      if (
        pathname === "/" &&
        e.target instanceof HTMLFormElement &&
        new URL(e.target.action).pathname === "/browse"
      )
        emit("homepage_search");
    };
    const click = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest("a") : null;
      if (a && ["wa.me", "api.whatsapp.com"].includes(new URL(a.href).hostname))
        emit("whatsapp_click", listingId);
    };
    document.addEventListener("submit", submit);
    document.addEventListener("click", click);
    return () => {
      document.removeEventListener("submit", submit);
      document.removeEventListener("click", click);
    };
  }, [pathname, enabled]);
  return null;
}
