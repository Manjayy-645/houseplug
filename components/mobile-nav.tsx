"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Users,
  User,
  Heart,
  LayoutDashboard,
  Wrench,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

export function MobileNav({
  servicesEnabled = false,
}: {
  servicesEnabled?: boolean;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) setRole(profile.role);
      }
      setLoading(false);
    };

    fetchRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          if (profile) setRole(profile.role);
          setLoading(false);
        }, 0);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hide bottom nav on specific auth pages, dashboard routes, student routes,
  // and listing detail pages (which display their own dedicated sticky contact bar)
  if (
    !pathname ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/landlord") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/listing/") ||
    pathname.startsWith("/services/")
  ) {
    return null;
  }

  const isLandlord =
    role === "landlord" || role === "agent" || role === "super_admin";
  const isStudent = role === "student";

  const navItems = [
    isStudent
      ? { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard }
      : { name: "Home", href: "/", icon: Home },
    { name: "Browse", href: "/browse", icon: Search },
    ...(servicesEnabled
      ? [{ name: "Services", href: "/services", icon: Wrench }]
      : []),
    isLandlord
      ? {
          name: "Dashboard",
          href: "/landlord/dashboard",
          icon: LayoutDashboard,
        }
      : { name: "Roommates", href: "/roommates", icon: Users },
    {
      name: "Profile",
      href: isLandlord
        ? "/landlord/profile"
        : isStudent
          ? "/student/profile"
          : "/profile",
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50 px-2 py-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]"
      style={{ visibility: loading ? "hidden" : "visible" }}
    >
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-12 relative ${isActive ? "text-primary" : "text-gray-600 hover:text-gray-700"}`}
            >
              {(item as any).badge && !isActive ? (
                <span className="absolute -top-1 right-1.5 px-1.5 py-0.2 rounded-full bg-[#1B4332] text-[#F59E0B] text-[8px] font-black tracking-wider leading-tight shadow-sm border border-emerald-500/40 animate-pulse">
                  {(item as any).badge}
                </span>
              ) : (item as any).highlight && !isActive ? (
                <span className="absolute top-0 right-2 w-2.5 h-2.5 bg-[#F59E0B] rounded-full border-2 border-white animate-pulse"></span>
              ) : null}
              <item.icon
                className={`h-5 w-5 mb-1 transition-transform ${isActive ? "scale-110 text-primary" : ""}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${isActive ? "font-bold text-primary" : ""}`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
