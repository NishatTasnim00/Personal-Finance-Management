import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import SpendCalender from "@/components/common/SpendCalender";
import Select from "react-select";

const getSchema = (type) => {
  const base = {
    amount: z.coerce
      .number({ invalid_type_error: "Amount must be a number" })
      .positive("Amount must be greater than 0"),
    date: z.date({
      required_error: "Date is required",
      invalid_type_error: "Please select a valid date",
    }),
    description: z.string().max(100, "Max 100 characters").optional(),
    recurring: z.boolean().optional(),
  };

  if (type === "income") {
    return z.object({
      ...base,
      source: z.string().min(1, "Source is required"),
    });
  }
  if (type === "expense") {
    return z.object({
      ...base,
      category: z.string().min(1, "Category is required"),
    });
  }

  if (type === "budget") {
    return z.object({
      ...base,
      category: z.string().min(1, "Category is required"),
      period: z.enum(["monthly", "weekly", "yearly"], {
        required_error: "Period is required",
      }),
    });
  }

  return z.object({
    ...base,
    type: z.string().min(1, "Category is required"),
  });
};

const TransactionForm = ({
  sources = [],
  type = "income",
  // categories = [],
  selectedTransaction = null,
  onSubmit = () => {},
  isSubmitting = false,
  // onSuccess = () => {},
  onClose = () => {},
}) => {
  const isEditMode = !!selectedTransaction;
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const fieldName = type === "income" ? "source" : "category";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(getSchema(type)),
    defaultValues: {
      [fieldName]: selectedTransaction?.[fieldName] || "",
      amount: selectedTransaction?.amount || "",
      description: selectedTransaction?.description || "",
      date: new Date(selectedTransaction?.date),
      recurring: selectedTransaction?.recurring ?? false,
    },
  });

  const options = sources.map((source) => ({
    value: source.value,
    label: (
      <div className="flex items-center gap-3">
        <source.icon style={{ color: source.color }} size={20} />
        <span>{source.name}</span>
      </div>
    ),
  }));

  // Reset form when selectedTransaction changes (edit mode)
  useEffect(() => {
    if (selectedTransaction) {
      const transactionDate = selectedTransaction.date
        ? new Date(selectedTransaction.date)
        : new Date();
        const matchedSource = sources.find(s => s.value === selectedTransaction[fieldName]);
      reset({
        [fieldName]: selectedTransaction?.[fieldName] || "",
        amount: selectedTransaction.amount || 0,
        description: selectedTransaction.description || "",
        date: transactionDate,
        recurring: selectedTransaction?.recurring ?? false,
        
      });
      setSelectedDate(transactionDate); // also keep calendar in sync
      setSelectedOption(matchedSource ? {
    value: matchedSource.value,
    label: (
      <div className="flex items-center gap-3">
        <matchedSource.icon style={{ color: matchedSource.color }} size={20} />
        <span>{matchedSource.name}</span>
      </div>
    )
  } : null);
    } else {
      const today = new Date();
      reset({
        [fieldName]: "",
        amount: 0,
        description: "",
        date: today,
        recurring: false,
      });
      setSelectedDate(today);
      setSelectedOption(null);
    }
  }, [selectedTransaction, reset, fieldName, sources]);

  return (
    <>
      <dialog id="transaction-form-modal" className="modal">
        <div className="modal-box w-11/12 max-w-lg overflow-visible">
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle hover:bg-neutral absolute right-4 top-4 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="font-bold text-xl mb-6 capitalize">
            {isEditMode ? `Edit ${type}` : `Add New ${type}`}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">
                <span className="label-text font-medium capitalize">{fieldName} *</span>
              </label>
              <Select
                options={options}
                value={selectedOption}
                onChange={(option) =>{ option && setValue(fieldName, option.value), setSelectedOption(option)}}
                placeholder={`Select ${fieldName}`}
                classNamePrefix="react-select"
                className="input w-full p-0"
              />
              {errors[fieldName]?.message && (
                <p className="text-error text-sm mt-1">
                  {errors[fieldName].message}
                </p>
              )}
            </div>
            <div className="relative">
              <label className="label">
                <span className="label-text font-medium">
                  Description (optional)
                </span>
              </label>
              <input
                {...register("description")}
                type="text"
                maxLength={100}
                placeholder="Short description"
                className={`input input-bordered w-full ${
                  errors.description ? "input-error" : ""
                }`}
              />
              <div className="absolute -bottom-6 right-0 flex items-center gap-1 text-xs">
                <span
                  className={`font-medium ${
                    (watch("description")?.length || 0) > 90
                      ? "text-error"
                      : (watch("description")?.length || 0) > 70
                      ? "text-warning"
                      : "text-base-content/50"
                  }`}
                >
                  {watch("description")?.length || 0}
                </span>
                <span className="text-base-content/40">/ 100</span>
              </div>
              {errors.description && (
                <p className="text-error text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">
                <span className="label-text font-medium">Amount *</span>
              </label>
              <input
                {...register("amount", {
                  valueAsNumber: true,
                })}
                type="number"
                min="0"
                placeholder="0.00"
                className={`input input-bordered w-full ${
                  errors.amount ? "input-error" : ""
                }`}
              />
              {errors.amount && (
                <p className="text-error text-sm mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">
                <span className="label-text font-medium">Date *</span>
              </label>
              <input type="hidden" {...register("date")} value={selectedDate} />
              <SpendCalender
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date), setValue("date", date || new Date());
                }}
                error={!!errors.date}
                maxDate={new Date()}
              />
              {errors.date && (
                <p className="text-error text-sm mt-1">{errors.date.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full capitalize"
            >
              {isSubmitting ? (
                <span className="loading loading-spinner text-base-content loading-sm"></span>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {isEditMode ? `Update ${type}` : `Add ${type}`}
                </>
              )}
            </button>
          </form>
        </div>
        <form
          method="dialog"
          className="modal-backdrop bg-indigo-300 opacity-10"
        >
          <button onClick={onClose}>close</button>
        </form>
      </dialog>
      <style jsx="true">{`
        .react-select__control {
          background-color: var(--color-base-100) !important;
          border: none;
          border-radius: 0.5rem !important;
          box-shadow: none !important;
          transition: all 0.2s ease;
          width: 100%;
        }

        :global(.react-select__value-container) {
          padding: 0 12px !important;
        }

        .react-select__single-value {
          color: var(--color-base-content) !important;
        }

        .react-select__placeholder {
          color: hsl(var(--base-content) / 0.1);
        }

        .react-select__indicator-separator {
          background-color: var(--color-base-300) !important;
        }

        .react-select__dropdown-indicator {
          color: var(--color-base-content) / 0.7 !important;
        }

        .react-select__dropdown-indicator:hover {
          color: var(--color--priamry) !important;
        }

        .react-select__menu {
          background-color: var(--color-base-100) !important;
          border: 1px solid var(--color-base-300) !important;
          border-radius: 0.5rem !important;
          margin-top: 4px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          z-index: 9999 !important;
        }

        :global(.react-select__menu-list) {
          padding: 4px !important;
        }

        :global(.react-select__option) {
          border-radius: 0.375rem !important;
          padding: 10px 12px !important;
          color: var(--color-base-content) !important;
          font-size: 0.95rem;
          transition: all 0.15s ease;
        }

        .react-select__option:hover,
        .react-select__option--is-focused {
          background-color: var(--color-neutral) !important;
          color: white !important;
          font-weight: 600;
        }

        .react-select__option--is-selected {
          background-color: var(--color-neutral) !important;
          color: white !important;
          font-weight: 600;
        }

        /* Optional: Error state */
        :global(.react-select__control.react-select-error) {
          border-color: var(--color-error) !important;
          box-shadow: 0 0 0 3px hsl(var(--er) / 0.2) !important;
        }

        /* Dark mode fix for icons inside options (if using Lucide) */
        :global(.react-select__option svg) {
          opacity: 0.9;
        }
      `}</style>
    </>
  );
};

export default TransactionForm;
