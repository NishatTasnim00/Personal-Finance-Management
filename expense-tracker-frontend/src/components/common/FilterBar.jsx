import { useState, useEffect } from "react";
import { Calendar, Filter as FilterIcon, X } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import SpendCalender from "@/components/common/SpendCalender";
import { subDays } from "date-fns"

const CustomDateInput = ({ value, onClick, placeholder }) => (
  <button
    type="button"
    onClick={onClick}
    className="input input-bordered input-sm w-40 text-left flex justify-between items-center pr-2"
  >
    <span className="truncate">{value || placeholder}</span>
    <Calendar className="w-4 h-4 opacity-60" />
  </button>
);

const FilterBar = ({
  filter, setFilter,
  from, setFrom,
  to, setTo,
  source, setSource,
  sourceOptions = [], // e.g., ["salary", "freelance", "investment", "gift"]
  sourcePlaceholder = "All Sources",
  onApplyFilters, // callback when filters change
  className = ""
}) => {
  // Sync URL params whenever filters change
  useEffect(() => {
    onApplyFilters?.();
  }, [filter, from, to, source]);

  const handleClear = () => {
    setFilter("all");
    setFrom("");
    setTo("");
    setSource("");
  };

  const isCustom = filter === "custom";
  const hasActiveFilter = filter !== "all" || from || to || source;

  return (
    <div className={`bg-base-300 backdrop-blur-sm border-b border-base-300 sticky mb-10 top-0 z-20 ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">

          {/* Left: Period Buttons */}
          <div className="flex flex-wrap gap-2">
            {["all", "today", "week", "month", "year"].map((period) => (
              <button
                key={period}
                onClick={() => {
                  setFilter(period);
                  if (period !== "custom") {
                    setFrom("");
                    setTo("");
                  }
                }}
                className={`btn btn-sm capitalize ${filter === period ? "btn-primary" : "btn-ghost"}`}
              >
                {period === "all" ? "All Time" : period === "today" ? "Today" : `This ${period}`}
              </button>
            ))}

            <button
              onClick={() => setFilter(isCustom ? "all" : "custom")}
              className={`btn btn-sm ${isCustom ? "btn-primary" : "btn-outline"}`}
            >
              {isCustom ? "Custom Range" : "Pick Dates"}
            </button>
          </div>

          {/* Right: Source + Date Pickers */}
          <div className="flex items-center gap-3 flex-wrap">

            {/* Source Dropdown */}
            {sourceOptions.length > 0 && (
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="select select-bordered select-sm w-full md:w-48 h-8"
              >
                <option value="">{sourcePlaceholder}</option>
                {sourceOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            )}

            {/* Custom Date Range */}
            {isCustom && (
              <div className="flex items-center gap-2 w-full md:w-96 flex-col md:flex-row">
                <SpendCalender
                  selected={ subDays(new Date(), 7) }
                  onChange={(date) => setFrom(date)}
                  maxDate={new Date()}
                  placeholder="yyyy-mm-dd"
                  position='right'
                />
                <span className="text-base-content/60">→</span>
                <SpendCalender
                  selected={ new Date()}
                  onChange={(date) => setTo(date)}
                  maxDate={new Date()}
                  placeholder="yyyy-mm-dd"
                  position='right-0'
                />
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Indicator */}
        {hasActiveFilter && (
          <div className="mt-4 flex items-center gap-3 text-sm text-base-content/70">
            <FilterIcon className="w-4 h-4" />
            <span>
              Showing:{" "}
              <span className="font-semibold text-primary">
                {source && `${source} • `}
                {isCustom
                  ? `${from ? new Date(from).toLocaleDateString() : "?"} → ${to ? new Date(to).toLocaleDateString() : "?"}`
                  : filter === "today" ? "Today"
                  : filter === "week" ? "This Week"
                  : filter === "month" ? "This Month"
                  : filter === "year" ? "This Year"
                  : "All Time"}
              </span>
            </span>

            <button
              onClick={handleClear}
              className="ml-auto text-xs underline hover:text-primary flex items-center gap-1  cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;