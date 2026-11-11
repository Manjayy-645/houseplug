import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageCircle, ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 px-5 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 lg:flex-row lg:px-8">
        <div className="max-w-xs">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center gap-2 text-xl font-bold text-primary"
          >
            <Image
              src="/logo.png"
              alt=""
              width={36}
              height={36}
              className="rounded-lg"
            />
            HousePlug
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Student housing, simplified. Find rooms near campus, compare the
            costs and connect directly with landlords and agents.
          </p>
          <p className="mt-5 flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Port Harcourt, Nigeria
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-9 sm:grid-cols-3 sm:gap-10">
          <nav aria-label="Footer navigation">
            <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-primary">
              Explore HousePlug
            </h2>
            {[
              ["/browse", "Available rooms"],
              ["/roommates", "Roommate matching"],
              ["/services", "Campus services"],
              ["/signup", "List your property"],
              ["/about", "About us"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center text-sm text-gray-600 transition-colors hover:text-primary hover:underline"
              >
                {label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Footer support and policies">
            <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-primary">
              Help &amp; information
            </h2>
            {[
              ["/contact", "Contact support"],
              ["/safety", "Safety guide"],
              ["/guides/student-rental-fees-nigeria", "Rental fees explained"],
              ["/terms", "Terms & refund policy"],
              ["/privacy", "Privacy policy"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center text-sm text-gray-600 transition-colors hover:text-primary hover:underline"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="col-span-2 max-w-xs sm:col-span-1">
            <h2 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-primary">
              Stay connected
            </h2>
            <a
              href="https://whatsapp.com/channel/0029VbCtrHY7oQhhDU4qIC0I"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-20 items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition hover:bg-emerald-100"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#13783A] text-white">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-bold text-emerald-900">
                  Official WhatsApp channel
                </span>
                <span className="mt-1 block text-xs text-gray-600">
                  Listings &amp; housing updates
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-emerald-800"
              />
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-gray-200 pt-6 text-center text-xs text-gray-600 sm:text-left lg:mx-auto lg:px-8">
        © {new Date().getFullYear()} HousePlug. Built for Nigerian students.
      </div>
    </footer>
  );
}
