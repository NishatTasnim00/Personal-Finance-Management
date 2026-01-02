import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Select from "react-select";
import SpendCalender from "@/components/common/SpendCalender";
import { recurringOption, defaultGoalSuggestions } from "@/lib/helper";

const goalSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    targetAmount: z.coerce.number().positive("Target must be greater than 0"),
    currentAmount: z.coerce.number().min(0).optional(),
    deadline: z.date().optional(),
    icon: z.string().default("Target"),
    color: z.string().default("#10b981"),
    recurring: z.boolean().default(false),
    recurringAmount: z.coerce.number().positive().optional(),
    recurringFrequency: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.recurring || (data.recurringAmount && data.recurringAmount > 0),
    { message: "Amount required for recurring", path: ["recurringAmount"] }
  );

const GoalForm = ({ goal, onSubmit, onClose }) => {
  const isEditMode = !!goal;
  const [selectedDate, setSelectedDate] = useState(
    goal?.deadline ? new Date(goal.deadline) : null
  );
  const [selectedTitleOption, setSelectedTitleOption] = useState(null);
  const modalRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: goal?.title || "",
      targetAmount: goal?.targetAmount || "",
      currentAmount: goal?.currentAmount || 0,
      deadline: goal?.deadline ? new Date(goal.deadline) : undefined,
      icon: goal?.icon || "Target",
      color: goal?.color || "#10b981",
      recurring: goal?.recurring || false,
      recurringAmount: goal?.recurringAmount || "",
      recurringFrequency: goal?.recurringFrequency || "monthly",
    },
  });

  const recurring = watch("recurring");

  // Preset options for react-select
  const titleOptions = [
    ...defaultGoalSuggestions.map((s) => ({
      value: s.title,
      label: s.title,
      data: s, // full preset data
    })),
    { value: "custom", label: "➕ Other (Custom Title)", isCustom: true },
  ];

  // Reset form when goal changes (edit mode) or on mount
  useEffect(() => {
    if (goal) {
      const deadlineDate = goal.deadline ? new Date(goal.deadline) : null;
      reset({
        title: goal.title || "",
        targetAmount: goal.targetAmount || "",
        currentAmount: goal.currentAmount || 0,
        deadline: deadlineDate || undefined,
        icon: goal.icon || "Target",
        color: goal.color || "#10b981",
        recurring: goal.recurring || false,
        recurringAmount: goal.recurringAmount || "",
        recurringFrequency: goal.recurringFrequency || "monthly",
      });
      setSelectedDate(deadlineDate);
      setSelectedTitleOption({
        value: goal.title,
        label: goal.title,
      });
    } else {
      reset({
        title: "",
        targetAmount: "",
        currentAmount: 0,
        deadline: undefined,
        icon: "Target",
        color: "#10b981",
        recurring: false,
        recurringAmount: "",
        recurringFrequency: "monthly",
      });
      setSelectedDate(null);
      setSelectedTitleOption(null);
    }
  }, [goal, reset]);

  // Handle title selection from dropdown
  const handleTitleChange = (option) => {
    if (!option) {
      setSelectedTitleOption(null);
      setValue("title", "");
      return;
    }

    setSelectedTitleOption(option);
    setValue("title", option.value);

    // If it's a preset, auto-fill related fields
    if (option.data && !option.isCustom) {
      const preset = option.data;
      setValue("targetAmount", preset.targetAmount);
      setValue("icon", preset.icon);
      setValue("color", preset.color);

      if (preset.recurring) {
        setValue("recurring", true);
        setValue("recurringAmount", preset.recurringAmount);
        setValue("recurringFrequency", preset.recurringFrequency || "monthly");
      } else {
        setValue("recurring", false);
        setValue("recurringAmount", "");
      }
    }
    // If "Other", just set title and allow manual entry
  };

  // Clean up on close
  const handleClose = () => {
    reset();
    setSelectedDate(null);
    setSelectedTitleOption(null);
    onClose();
  };

  return (
    <dialog id="goal-form-modal" className="modal modal-open" ref={modalRef}>
      <div className="modal-box w-11/12 max-w-2xl overflow-visible">
        <button
          onClick={handleClose}
          className="btn btn-sm btn-circle hover:bg-neutral absolute right-4 top-4 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-bold text-xl mb-6">
          {isEditMode ? "Edit Goal" : "Create New Goal"}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Goal Title - Select with Presets */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Goal Title *</span>
            </label>
            <Select
              options={titleOptions}
              value={selectedTitleOption}
              onChange={handleTitleChange}
              placeholder="Select a goal or choose 'Other'"
              classNamePrefix="react-select"
              className="w-full"
              isClearable={true}
              formatOptionLabel={(option) =>
                option.isCustom ? (
                  <span className="flex items-center gap-2 font-medium text-primary">
                    <Plus size={16} /> {option.label}
                  </span>
                ) : (
                  option.label
                )
              }
            />
            {errors.title && (
              <p className="text-error text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Target Amount */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Target Amount *</span>
            </label>
            <input
              {...register("targetAmount", { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              placeholder="100000"
              className={`input input-bordered w-full text-lg ${
                errors.targetAmount ? "input-error" : ""
              }`}
            />
            {errors.targetAmount && (
              <p className="text-error text-sm mt-1">
                {errors.targetAmount.message}
              </p>
            )}
          </div>

          {/* Current Amount */}
          <div>
            <label className="label">
              <span className="label-text font-medium">
                Current Saved (optional)
              </span>
            </label>
            <input
              {...register("currentAmount", { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              className="input input-bordered w-full"
            />
          </div>

          {/* Deadline - Custom Calendar */}
          <div>
            <label className="label">
              <span className="label-text font-medium">
                Deadline (optional)
              </span>
            </label>
            <input
              type="hidden"
              {...register("deadline")}
              value={selectedDate || ""}
            />
            <SpendCalender
              selected={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setValue("deadline", date || undefined);
              }}
              placeholderText="No deadline"
              error={!!errors.deadline}
              maxDate={null} // allow future dates
            />
            {errors.deadline && (
              <p className="text-error text-sm mt-1">
                {errors.deadline.message}
              </p>
            )}
          </div>

          {/* Recurring Section */}
          <div className="p-6 bg-base-200 rounded-xl">
            <div className="flex items-center gap-3 mb-5">
              <input
                type="checkbox"
                {...register("recurring")}
                className="checkbox checkbox-primary"
              />
              <label className="label-text font-medium cursor-pointer">
                Auto-save every period
              </label>
            </div>

            {recurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div>
                  <label className="label">
                    <span className="label-text">Amount per period</span>
                  </label>
                  <input
                    {...register("recurringAmount", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="5000"
                    className={`input input-bordered w-full ${
                      errors.recurringAmount ? "input-error" : ""
                    }`}
                  />
                  {errors.recurringAmount && (
                    <p className="text-error text-sm mt-1">
                      {errors.recurringAmount.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Frequency</span>
                  </label>
                  <select
                    {...register("recurringFrequency")}
                    className="select select-bordered w-full"
                  >
                    {recurringOption.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="modal-action">
            <button type="submit" className="btn btn-primary btn-wide">
              <Plus className="w-5 h-5" />
              {isEditMode ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop" onClick={handleClose}>
        <button type="button">close</button>
      </form>
    </dialog>
  );
};

export default GoalForm;
