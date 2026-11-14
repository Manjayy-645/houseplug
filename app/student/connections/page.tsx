import { requestActor } from "@/lib/request-auth";
import { ConnectionActions } from "@/components/connection-actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Clock, CheckCircle2, ShieldAlert, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function Page() {
  const a = await requestActor();
  if (!a || a.role !== "student") redirect("/login");

  const { data: connections } = await a.db
    .from("roommate_connections")
    .select("id,requester_id,recipient_id,status,created_at,updated_at")
    .or(`requester_id.eq.${a.id},recipient_id.eq.${a.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  // Fetch profiles of partner students
  const partnerIds = Array.from(
    new Set(
      connections?.map((c) =>
        c.requester_id === a.id ? c.recipient_id : c.requester_id,
      ) || [],
    ),
  );

  const profilesMap = new Map<
    string,
    {
      full_name: string;
      avatar_url: string | null;
      university?: string;
      profile_id?: string;
    }
  >();

  if (partnerIds.length > 0) {
    const { data: profiles } = await a.db
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", partnerIds);

    const { data: roommateProfiles } = await a.db
      .from("roommate_profiles")
      .select("id, user_id, university")
      .in("user_id", partnerIds);

    const roommateMap = new Map(
      (roommateProfiles || []).map((r) => [r.user_id, r]),
    );

    for (const p of profiles || []) {
      const rm = roommateMap.get(p.id);
      profilesMap.set(p.id, {
        full_name: p.full_name?.split(" ")[0] || "Student",
        avatar_url: p.avatar_url,
        university: rm?.university,
        profile_id: rm?.id,
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4 space-y-6">
        <div>
          <Link
            href="/student/roommate"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Roommate Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">
                Student Privacy
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Private Roommate Connections
              </h1>
            </div>
            <Link
              href="/roommates"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-xs"
            >
              <span>Browse Roommates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
            Your phone number is completely private until you and another student mutually accept a connection. You can cancel requests or revoke sharing anytime.
          </p>
        </div>

        {!connections?.length ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center space-y-4 shadow-xs">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 text-[#1B4332] flex items-center justify-center">
              <Users className="w-6 h-6 text-[#1B4332]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 text-base">
                No connection requests yet
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                When you connect with roommates or other students request to connect with you, your conversations and contacts will appear here.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/roommates"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:brightness-110 transition shadow-xs"
              >
                <span>Browse Student Roommates</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((c) => {
              const isOutgoing = c.requester_id === a.id;
              const partnerId = isOutgoing ? c.recipient_id : c.requester_id;
              const partner = profilesMap.get(partnerId);

              return (
                <article
                  key={c.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                        {partner?.avatar_url ? (
                          <img
                            src={partner.avatar_url}
                            alt={partner.full_name || "Student"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>
                            {(partner?.full_name?.[0] || "S").toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold text-gray-900 text-sm">
                            {partner?.full_name || "Student"}
                          </h2>
                          {partner?.profile_id && (
                            <Link
                              href={`/roommates/${partner.profile_id}`}
                              className="text-[11px] font-semibold text-[#1B4332] hover:underline"
                            >
                              View Profile
                            </Link>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isOutgoing ? "Outgoing request" : "Incoming request"}
                          {partner?.university ? ` • ${partner.university}` : ""}
                          {" • "}
                          {formatDate(c.created_at)}
                        </p>
                      </div>
                    </div>

                    <div>
                      {c.status === "accepted" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Connected</span>
                        </span>
                      ) : c.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full capitalize">
                          {c.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <ConnectionActions
                      target={partnerId}
                      status={c.status}
                      incoming={!isOutgoing}
                      targetName={partner?.full_name}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
