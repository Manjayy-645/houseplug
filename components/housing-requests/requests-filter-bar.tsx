"use client";

import { Search, Filter, X } from "lucide-react";
import { CAMPUS_ZONES, HOUSING_PROPERTY_TYPES, MOVE_IN_TIMELINES } from "@/lib/constants";

type RequestsFilterBarProps = {
  zone: string;
  propertyType: string;
  timeline: string;
  search: string;
  onZoneChange: (zone: string) => void;
  onPropertyTypeChange: (type: string) => void;
  onTimelineChange: (timeline: string) => void;
  onSearchChange: (search: string) => void;
  onReset: () => void;
  totalCount: number;
};

export function RequestsFilterBar({
  zone,
  propertyType,
  timeline,
  search,
  onZoneChange,
  onPropertyTypeChange,
  onTimelineChange,
  onSearchChange,
  onReset,
  totalCount,
}: RequestsFilterBarProps) {
  const hasActiveFilters =
    zone !== "all" || propertyType !== "all" || timeline !== "all" || search.trim() !== "";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by request code (#HP-...), location, or notes..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Select Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Campus Zone */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Area / Campus Zone
          </label>
          <select
            value={zone}
            onChange={(e) => onZoneChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          >
            <option value="all">All Campus Zones</option>
            {CAMPUS_ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Property / Lodge Type
          </label>
          <select
            value={propertyType}
            onChange={(e) => onPropertyTypeChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          >
            <option value="all">All Lodge Types</option>
            {HOUSING_PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Move-In Timeline */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Move-In Timeline
          </label>
          <select
            value={timeline}
            onChange={(e) => onTimelineChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          >
            <option value="all">All Timelines</option>
            {MOVE_IN_TIMELINES.map((tl) => (
              <option key={tl} value={tl}>
                {tl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Stats & Reset */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
        <span className="font-semibold text-gray-600">
          Showing <strong className="text-[#1B4332]">{totalCount}</strong> open {totalCount === 1 ? "request" : "requests"}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 font-bold text-red-600 hover:text-red-700 hover:underline"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
