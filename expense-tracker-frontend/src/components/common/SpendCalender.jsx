import { useState, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import '@/styles/SpendCalender.scss'

const SpendCalender = forwardRef(
  (
    {
      selected,
      onChange,
      error = false,
      disabled = false,
      maxDate,
      placeholder = "Select date",
      label = "Date",
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);

    return (
      <div ref={ref} className="relative w-full">
        
        {/* Floating label */}
        <label
          className={`
            pointer-events-none absolute left-3 top-2 z-50 origin-[0]
            -translate-y-4 scale-75 transform text-sm transition-all duration-200
            ${selected || open ? "scale-75 -translate-y-4" : "scale-100 translate-y-0"}
            ${error ? "text-error" : "text-primary"}
          `}
        >
          {label}
        </label>

        {/* Trigger (looks like an input) */}
        <div
          className={`
            flex h-12 items-center justify-between rounded-lg border bg-base-100 px-3 text-base
            transition-all cursor-pointer
            ${error
              ? "border-error focus-within:ring-error/30"
              : "border-base-300 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20"}
            ${disabled ? "cursor-not-allowed opacity-60" : ""}
          `}
          onClick={() => !disabled && setOpen(!open)}
        >
          <span
            className={`block truncate ${!selected ? "text-base-content/50" : ""}`}
          >
            {selected
              ? selected.toLocaleDateString("en-CA") // YYYY-MM-DD
              : placeholder}
          </span>
          <Calendar className="h-5 w-5 text-base-content/60" />
        </div>

        {/* Calendar popup */}
        {open && (
          <div className="absolute bottom-full z-50 mt-1 w-full">
            <DatePicker
              selected={selected}
              onChange={(date) => {
                onChange(date);
                setOpen(false);
              }}
              maxDate={maxDate}
              inline
              disabled={disabled}
              calendarClassName="shadow-xl border border-base-300 rounded-lg bg-base-100 spend-calender"
              onClickOutside={() => setOpen(false)}
              onSelect={() => setOpen(false)}
            />
          </div>
        )}

        {/* Optional error message */}
        {error && (
          <p className="mt-1 text-sm text-error">Please select a valid date</p>
        )}
      </div>
    );
  }
);

SpendCalender.displayName = "Spend Calender";



export default SpendCalender;