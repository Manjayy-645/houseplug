import { UNIVERSITIES, ROOM_TYPES } from "@/lib/constants";
export function HeroSearch() {
  const field =
    "w-full min-w-0 mt-1 rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-3 text-base";
  return (
    <form
      action="/browse"
      method="GET"
      className="grid grid-cols-2 gap-3 rounded-2xl bg-white text-gray-800 p-4 shadow-xl sm:grid-cols-2"
    >
      <label className="text-sm font-semibold flex flex-col justify-between">
        University
        <select name="university" required defaultValue="" className={field}>
          <option value="">Choose your campus</option>
          {UNIVERSITIES.map((u) => (
            <option key={u.id} value={u.id}>
              {u.shortName}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold flex flex-col justify-between">
        Preferred area
        <input
          name="q"
          maxLength={120}
          placeholder="Choba, Aluu…"
          className={field}
        />
      </label>
      <label className="text-sm font-semibold flex flex-col justify-between">
        Total move-in budget (₦)
        <input
          name="max_total"
          type="number"
          min={1}
          max={100000000}
          placeholder="Maximum total"
          className={field}
        />
      </label>
      <label className="text-sm font-semibold flex flex-col justify-between">
        Room type
        <select name="room_type" className={field}>
          <option value="">Any type</option>
          {ROOM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <button className="col-span-2 min-h-12 rounded-xl bg-[#1B4332] text-white px-5 py-3 font-bold">
        Find Available Rooms
      </button>
      <p className="col-span-2 text-xs text-gray-600">
        Budget results include confirmed initial housing costs. Listings with
        unknown totals are excluded when a total budget is set.
      </p>
    </form>
  );
}
