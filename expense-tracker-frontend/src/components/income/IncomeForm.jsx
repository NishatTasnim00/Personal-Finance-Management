import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X } from "lucide-react";
import { useEffect } from "react";
import api from "@/lib/api";
import SpendCalender from "@/components/common/SpendCalender";
import { toastSuccess, toastError } from "@/lib/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { defaultIncomeSources } from "@/lib/helper";
import Select from "react-select";

const incomeSchema = z.object({
  source: z.string().min(1, "Source is required"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  description: z.string().max(100, "Max 100 characters allowed").optional(),
  date: z.coerce.date({ required_error: "Date is required" }),
});

const incomeSources = defaultIncomeSources || [];

const IncomeForm = ({ onSuccess, selectedIncome, setSelectedIncome }) => {
  const queryClient = useQueryClient();
  const isEditMode = !!selectedIncome;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    setFocus,
  } = useForm({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      source: selectedIncome?.source || "",
      amount: selectedIncome?.amount || "",
      description: selectedIncome?.description || "",
      date: selectedIncome ? new Date(selectedIncome?.date) : new Date(),
    },
  });
  const dateValue = watch("date");
  const selectedDateForCalendar = !dateValue ? new Date() : new Date(dateValue);

  // React Query Mutation
  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        source: data.source,
        description: data.description?.trim() || "",
        amount: Number(data.amount),
        date: data.date.toISOString().split("T")[0],
      };

      if (isEditMode) {
        return api.patch(`/incomes/${selectedIncome._id}`, payload);
      }
      return api.post("/incomes", payload);
    },
    onSuccess: () => {
      toastSuccess(isEditMode ? "Income updated!" : "Income added!");
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      onSuccess?.();
      closeModal();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Something went wrong";
      toastError(msg);
    },
  });

  // Reset form when selectedIncome changes (edit mode)
  useEffect(() => {
    if (selectedIncome) {
      reset({
        source: selectedIncome.source || "",
        amount: selectedIncome.amount || "",
        description: selectedIncome.description || "",
        date: new Date(selectedIncome.date),
      });
    } else {
      reset({
        source: "",
        amount: "",
        description: "",
        date: new Date(),
      });
    }
  }, [selectedIncome, reset]);

  // Auto-focus source field when modal opens
  useEffect(() => {
    const modal = document.getElementById("income-form-modal");
    const handleOpen = () => setTimeout(() => setFocus("source"), 100);
    modal?.addEventListener("open", handleOpen);
    return () => modal?.removeEventListener("open", handleOpen);
  }, [setFocus]);

  const closeModal = () => {
    document.getElementById("income-form-modal")?.close();
    setSelectedIncome(null);
  };

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const options = incomeSources.map((source) => ({
    value: source.value,
    label: (
      <div className="flex items-center gap-3">
        <source.icon style={{ color: source.color }} size={20} />
        <span>{source.name}</span>
      </div>
    ),
  }));

  return (
    <>
    <dialog id="income-form-modal" className="modal">
      <div className="modal-box w-11/12 max-w-lg overflow-visible">
        <button
          onClick={closeModal}
          className="btn btn-sm btn-circle hover:bg-neutral absolute right-4 top-4 z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-xl mb-6">
          {isEditMode ? "Edit Income" : "Add New Income"}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label">
              <span className="label-text font-medium">Source *</span>
            </label>
            <Select
              options={options}
              onChange={(option) => setValue("source", option.value)}
              placeholder="Select Source"
              classNamePrefix="react-select"
              className="input  w-full p-0"
            />
            {errors.source && (
              <p className="text-error text-sm mt-1">{errors.source.message}</p>
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
              {...register("amount", { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className={`input input-bordered w-full ${
                errors.amount ? "input-error" : ""
              }`}
            />
            {errors.amount && (
              <p className="text-error text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>
          <div>
            <label className="label">
              <span className="label-text font-medium">Date *</span>
            </label>
            <SpendCalender
              selected={selectedDateForCalendar}
              onChange={(date) => setValue("date", date || new Date())}
              error={!!errors.date}
              maxDate={new Date()}
            />
            {errors.date && (
              <p className="text-error text-sm mt-1">{errors.date.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn btn-primary w-full"
          >
            {mutation.isPending ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                {isEditMode ? "Update Income" : "Add Income"}
              </>
            )}
          </button>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop bg-indigo-300 opacity-10">
        <button onClick={closeModal}>close</button>
      </form>
    </dialog>
    <style jsx>{`
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
    color: var(--color-base-content)/0.7 !important;
  }

  .react-select__dropdown-indicator:hover {
    color: var(--color--priamry) !important;
  }

  .react-select__menu {
    background-color: var(--color-base-100) !important;
    border: 1px solid var(--color-base-300) !important;
    border-radius: 0.5rem !important;
    margin-top: 4px !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
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
    box-shadow: 0 0 0 3px hsl(var(--er)/0.2) !important;
  }

  /* Dark mode fix for icons inside options (if using Lucide) */
  :global(.react-select__option svg) {
    opacity: 0.9;
  }
`}</style>
    </>
  );
};

export default IncomeForm;
