import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import "react-datepicker/dist/react-datepicker.css";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import api from "@/lib/api";
import SpendCalender from "@/components/common/SpendCalender";
import { toastSuccess, toastError } from "@/lib/toast";

const incomeSchema = z.object({
  source: z.string().min(1, "Source is required"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  description: z.string().max(100, "Description can't excced 100 char"),
  date: z.date(),
});

const IncomeForm = ({ onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultIncomeSources = [
    { name: "Salary", icon: "💼", color: "#10B981" },
    { name: "Freelance", icon: "💻", color: "#3B82F6" },
    { name: "Business", icon: "🏪", color: "#F59E0B" },
    { name: "Investment", icon: "📈", color: "#8B5CF6" },
    { name: "Gift", icon: "🎁", color: "#EC4899" },
    { name: "Other", icon: "📌", color: "#6B7280" },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      source: "",
      description: "",
      amount: undefined,
      date: new Date(),
    },
  });

  const selectedDate = watch("date");

  const onSubmit = (data) => {
    console.log(data);
    setIsSubmitting(true);

    const payload = {
      source: data.source.toLowerCase(),
      description: data.description,
      amount: data.amount,
      date: data.date.toISOString().split("T")[0],
    };
    //TODO: convert to TQ
    api
      .post("/incomes", payload)
      .then((response) => {
        if (response.status === "success") {
          toastSuccess("Income added successfully!");
          onSuccess?.();
          reset();
          document.getElementById("income-form-modal").remove();
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Failed to add income";
        toastError(msg);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <dialog id="income-form-modal" className="modal">
      <div className="modal-box h-auto overflow-visible">
        <form method="dialog" className="absolute right-2 top-2">
          <button className="btn btn-sm btn-circle btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </form>
        <h3 className="font-bold text-lg mb-4">Add New Income</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text font-medium">Source *</span>
            </label>
            <select
              {...register("source")}
              className={`select select-bordered w-full ${
                errors.source ? "select-error" : ""
              }`}
            >
              <option value="">Select Source</option>
              {defaultIncomeSources.map((source) => (
                <option key={source.name} value={source.name}>
                  {source.icon} {source.name}
                </option>
              ))}
            </select>
            {errors.source && (
              <p className="text-error text-sm mt-1">{errors.source.message}</p>
            )}
          </div>
          <div className="relative">
            <label className="label">
              <span className="label-text font-medium">Description</span>
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
            {/* Character Counter - Bottom Right */}
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
              min={0}
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
              <span className="label-text font-medium">Transaction Date *</span>
            </label>
            <div className="h-10">
              <SpendCalender
                selected={selectedDate}
                onChange={(date) => setValue("date", date)}
                error={!!errors.date}
                maxDate={new Date()}
                placeholder="yyyy-mm-dd"
              />
            </div>
            {errors.date && (
              <p className="text-error text-sm mt-1">{errors.date.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Income
              </>
            )}
          </button>
        </form>
      </div>
    </dialog>
  );
};

export default IncomeForm;
