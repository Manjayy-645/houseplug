import {
  GraduationCap,
  MapPin,
  Wallet,
  Home,
  Search,
  ChevronDown,
} from "lucide-react";
import { UNIVERSITIES, ROOM_TYPES } from "@/lib/constants";

export function HeroSearch() {
  const row =
    "flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors focus-within:bg-gray-50 xl:rounded-none xl:border-r xl:border-gray-100 xl:px-4";
  const icon =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary";
  const label =
    "block text-[10px] font-extrabold uppercase tracking-wider text-gray-600 sm:text-xs";
  const field =
    "mt-1 min-h-8 w-full min-w-0 appearance-none border-0 bg-transparent p-0 pr-4 text-base font-bold text-primary outline-none placeholder:font-medium placeholder:text-gray-500";
  return (
    <div className="mx-auto w-full max-w-6xl">
      <form
        action="/browse"
        method="GET"
        aria-label="Find student accommodation"
        className="grid grid-cols-2 gap-1 rounded-[2rem] border border-white/50 bg-white/95 p-3 text-gray-900 shadow-2xl shadow-black/15 backdrop-blur-md xl:grid-cols-[1.1fr_1fr_1.1fr_1fr_auto] xl:items-center xl:rounded-full xl:p-2"
      >
        <label className={`${row} col-span-2 xl:col-span-1`}>
          <span className={icon}>
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className={label}>University</span>
            <select
              name="university"
              required
              defaultValue=""
              className={field}
            >
              <option value="">Select campus</option>
              {UNIVERSITIES.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.shortName}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 right-0 h-4 w-4 text-gray-500"
            />
          </span>
        </label>
        <label className={row}>
          <span className={`${icon} hidden sm:flex`}>
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className={label}>Preferred area</span>
            <input
              name="q"
              maxLength={120}
              placeholder="Choba, Aluu…"
              className={field}
            />
          </span>
        </label>
        <label className={row}>
          <span className={`${icon} hidden sm:flex`}>
            <Home className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className={label}>Room type</span>
            <select name="room_type" className={field}>
              <option value="">Any type</option>
              {ROOM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 right-0 h-4 w-4 text-gray-500"
            />
          </span>
        </label>
        <label className={`${row} col-span-2 xl:col-span-1 xl:border-r-0`}>
          <span className={icon}>
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className={label}>Total move-in budget (₦)</span>
            <input
              name="max_total"
              type="number"
              min={1}
              max={100000000}
              placeholder="Any budget"
              className={field}
            />
          </span>
        </label>
        <button className="col-span-2 flex min-h-14 items-center justify-center gap-2 rounded-full bg-hp-amber px-6 py-4 text-sm font-extrabold text-primary shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 active:scale-[0.98] xl:col-span-1">
          <Search className="h-4 w-4" aria-hidden="true" />
          Find Available Rooms
        </button>
      </form>
      <p className="mx-auto mt-4 max-w-3xl px-3 text-xs leading-relaxed text-white">
        Budget results include confirmed initial housing costs. Listings with
        unknown totals are excluded when a total budget is set.
      </p>
    </div>
  );
}
