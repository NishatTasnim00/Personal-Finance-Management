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
      // label = "Date",
      position = 'bottom-full',
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    console.log(selected);

    return (
      <div ref={ref} className="relative w-full h-full">
        <div
          className={`
            flex h-full items-center justify-between rounded-lg border bg-base-100 px-3 text-base
            transition-all cursor-pointer relative  min-h-8
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
          <Calendar className='h-5 w-5 text-base-content/60' />
        </div>

        {/* Calendar popup */}
        {open && (
          <div className={`absolute ${position} z-50 mt-1`}>
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