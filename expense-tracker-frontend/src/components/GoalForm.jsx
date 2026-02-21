import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import Select from "react-select";
import SpendCalender from "@/components/common/SpendCalender";
import { recurringOption, defaultGoalSuggestions } from "@/lib/helper";

const goalSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    targetAmount: z.coerce.number().positive("Target must be greater than 0"),
    currentAmount: z.coerce.number().min(0).optional(),
    deadline: z.date().optional().nullable(),
    icon: z.string().default("🎯"),
    color: z.string().default("#10b981"),
    recurring: z.boolean().default(false),
    recurringAmount: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number().positive().optional()
    ),
    recurringFrequency: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.recurring || (data.recurringAmount && data.recurringAmount > 0),
    { message: "Amount required for recurring", path: ["recurringAmount"] },
  )
  .refine(
    (data) => {
      if (data.currentAmount !== undefined && data.currentAmount !== null && data.targetAmount != null) {
        return data.currentAmount <= data.targetAmount;
      }
      return true;
    },
    {
      message: "Current saved cannot exceed target amount",
      path: ["currentAmount"],
    },
  )
  .refine(
    (data) => {
      if (data.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(data.deadline);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      }
      return true;
    },
    {
      message: "Deadline cannot be in the past",
      path: ["deadline"],
    },
  );

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const GoalForm = ({ goal, onSubmit, onClose, isSubmitting = false }) => {
  const isEditMode = !!goal;
  const [selectedDate, setSelectedDate] = useState(
    goal?.deadline ? new Date(goal.deadline) : null,
  );
  const [selectedTitleOption, setSelectedTitleOption] = useState(null);

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
      icon: goal?.icon || "🎯",
      color: goal?.color || "#10b981",
      recurring: goal?.recurring || false,
      recurringAmount: goal?.recurringAmount || "",
      recurringFrequency: goal?.recurringFrequency || "monthly",
    },
  });

  const recurring = watch("recurring");
  const targetAmount = watch("targetAmount");
  const currentAmount = watch("currentAmount");
  const selectedColor = watch("color");
  const selectedIcon = watch("icon");

  const remaining = targetAmount && currentAmount !== undefined && currentAmount !== null
    ? targetAmount - currentAmount
    : null;
  const isGoalCompleted = remaining !== null && remaining <= 0;

  const titleOptions = [
    ...defaultGoalSuggestions.map((s) => ({
      value: s.title,
      label: (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{s.icon}</span>
          <span>{s.title}</span>
        </div>
      ),
      data: s,
    })),
    {
      value: "custom",
      label: (
        <span className="flex items-center gap-2 font-medium text-primary">
          <Plus size={16} /> Other (Custom Title)
        </span>
      ),
      isCustom: true,
    },
  ];

  useEffect(() => {
    if (isGoalCompleted && recurring) {
      setValue("recurring", false);
      setValue("recurringAmount", undefined, { shouldValidate: false });
    }
  }, [isGoalCompleted, recurring, setValue]);

  useEffect(() => {
    if (goal) {
      const deadlineDate = goal.deadline ? new Date(goal.deadline) : null;
      const matchedPreset = defaultGoalSuggestions.find(
        (s) => s.title === goal.title,
      );
      reset({
        title: goal.title || "",
        targetAmount: goal.targetAmount || "",
        currentAmount: goal.currentAmount || 0,
        deadline: deadlineDate || undefined,
        icon: goal.icon || "🎯",
        color: goal.color || "#10b981",
        recurring: goal.recurring || false,
        recurringAmount: goal.recurringAmount || "",
        recurringFrequency: goal.recurringFrequency || "monthly",
      });
      setSelectedDate(deadlineDate);
      setSelectedTitleOption(
        matchedPreset
          ? {
              value: matchedPreset.title,
              label: (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{matchedPreset.icon}</span>
                  <span>{matchedPreset.title}</span>
                </div>
              ),
              data: matchedPreset,
            }
          : {
              value: goal.title,
              label: (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{goal.icon || "🎯"}</span>
                  <span>{goal.title}</span>
                </div>
              ),
            },
      );
    } else {
      reset({
        title: "",
        targetAmount: "",
        currentAmount: 0,
        deadline: undefined,
        icon: "🎯",
        color: "#10b981",
        recurring: false,
        recurringAmount: "",
        recurringFrequency: "monthly",
      });
      setSelectedDate(null);
      setSelectedTitleOption(null);
    }
  }, [goal, reset]);

  const handleTitleChange = (option) => {
    if (!option) {
      setSelectedTitleOption(null);
      setValue("title", "");
      return;
    }

    setSelectedTitleOption(option);
    setValue("title", option.value);

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
  };

  const handleClose = () => {
    reset();
    setSelectedDate(null);
    setSelectedTitleOption(null);
    onClose();
  };

  const handleFormSubmit = (data) => {
    const formData = {
      ...data,
      deadline: selectedDate || null,
      currentAmount: Number(data.currentAmount) || 0,
      targetAmount: Number(data.targetAmount),
      recurring: isGoalCompleted ? false : (data.recurring || false),
      recurringAmount: isGoalCompleted ? 0 : (data.recurring ? (Number(data.recurringAmount) || 0) : 0),
      recurringFrequency: isGoalCompleted ? "monthly" : (data.recurring ? (data.recurringFrequency || "monthly") : "monthly"),
    };
    onSubmit(formData);
  };

  const handleFrequencyChange = (frequency) => {
    setValue("recurringFrequency", frequency);
  };

  return (
    <>
      <dialog id="goal-form-modal" className="modal">
        <div className="modal-box w-11/12 max-w-2xl overflow-visible">
          <button
            onClick={handleClose}
            className="btn btn-sm btn-circle hover:bg-neutral absolute right-4 top-4 z-10"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <h3 className="font-bold text-xl">
              {isEditMode ? "Edit Goal" : "Create New Goal"}
            </h3>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
                isDisabled={isSubmitting}
                formatOptionLabel={(option) => option.label}
              />
              {errors.title && (
                <p className="text-error text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
              {selectedTitleOption?.isCustom && (
                <div className="mt-2">
                  <input
                    {...register("title")}
                    type="text"
                    placeholder="Enter custom goal title"
                    className={`input input-bordered w-full ${
                      errors.title ? "input-error" : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  {/* <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={selectedIcon}
                      onChange={(e) => setValue("icon", e.target.value)}
                      placeholder="🎯"
                      className="input input-bordered w-20 text-center text-xl"
                      maxLength={2}
                      disabled={isSubmitting}
                    />
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setValue("color", e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer"
                      disabled={isSubmitting}
                    />
                  </div> */}
                </div>
              )}
            </div>

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
                disabled={isSubmitting}
              />
              {errors.targetAmount && (
                <p className="text-error text-sm mt-1">
                  {errors.targetAmount.message}
                </p>
              )}
            </div>

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
                max={targetAmount || undefined}
                placeholder="0"
                className={`input input-bordered w-full ${
                  errors.currentAmount ? "input-error" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.currentAmount && (
                <p className="text-error text-sm mt-1">
                  {errors.currentAmount.message}
                </p>
              )}
            {targetAmount > 0 && Number.isFinite(currentAmount) && (
              <p className={`text-sm mt-1 ${remaining === 0 ? "text-success font-semibold" : "text-base-content/60"}`}>
                Remaining: ৳{(targetAmount - (currentAmount || 0)).toLocaleString()}
                {remaining === 0 && " - Goal Completed!"}
              </p>
            )}
            </div>

            <div>
              <label className="label">
                <span className="label-text font-medium">
                  Deadline (optional)
                </span>
              </label>
              <SpendCalender
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setValue("deadline", date || null, { shouldValidate: true });
                }}
                placeholder="No deadline"
                error={!!errors.deadline}
                minDate={startOfToday()}
                maxDate={null}
                disabled={isSubmitting}
              />
              {errors.deadline && (
                <p className="text-error text-sm mt-1">
                  {errors.deadline.message}
                </p>
              )}
            </div>

            <div className="p-6 bg-base-200 rounded-xl">
              <div className="flex items-center gap-3 mb-5">
                <input
                  type="checkbox"
                  {...register("recurring")}
                  className="checkbox checkbox-primary"
                  disabled={isSubmitting || isGoalCompleted}
                  onChange={(e) => {
                    if (!isGoalCompleted) {
                      setValue("recurring", e.target.checked);
                    }
                  }}
                />
                <label className={`label-text font-medium ${isGoalCompleted ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                  Auto-save every period
                  {isGoalCompleted && (
                    <span className="text-xs text-base-content/60 ml-2">(Goal completed)</span>
                  )}
                </label>
              </div>

              {recurring && (
                <div className="space-y-4 animate-in fade-in duration-300">
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
                      disabled={isSubmitting}
                    />
                    {errors.recurringAmount && (
                      <p className="text-error text-sm mt-1">
                        {errors.recurringAmount.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label mb-3">
                      <span className="label-text">Frequency</span>
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {recurringOption.map((opt) => {
                        const isSelected =
                          watch("recurringFrequency") === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleFrequencyChange(opt.value)}
                            className={`badge badge-lg cursor-pointer transition-all ${
                              isSelected
                                ? "badge-primary"
                                : "badge-outline badge-ghost"
                            }`}
                            disabled={isSubmitting}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-ghost"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-wide"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    {isEditMode ? "Update Goal" : "Create Goal"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <form method="dialog" className="modal-backdrop" onClick={handleClose}>
          <button type="button" disabled={isSubmitting}>
            close
          </button>
        </form>
      </dialog>
      <style jsx="true">{`
        .react-select__control {
          background-color: var(--color-base-100) !important;
          border: 1px solid var(--color-base-300) !important;
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
          box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
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

export default GoalForm;
