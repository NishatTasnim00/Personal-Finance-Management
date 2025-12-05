// src/hooks/expense.js
import api from "@/lib/api";
import { toastSuccess, toastError } from "@/lib/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetExpenses = ({
  period,
  startDate,
  endDate,
  category,
  recurring,
  enabled = true,
}) => {
  return useQuery({
    queryKey: [
      "expenses",
      period,
      period === "custom" ? startDate : null,
      period === "custom" ? endDate : null,
      category,
      recurring,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (period && period !== "all" && period !== "custom") {
        params.append("period", period);
      }

      if (period === "custom") {
        if (startDate && startDate instanceof Date && !isNaN(startDate)) {
          params.append("startDate", startDate.toISOString().split("T")[0]);
        }
        if (endDate && endDate instanceof Date && !isNaN(endDate)) {
          params.append("endDate", endDate.toISOString().split("T")[0]);
        }
      }

      if (category) params.append("category", category);
      if (recurring !== undefined) params.append("recurring", recurring);

      const url = `/expenses${params.toString() ? `?${params.toString()}` : ""}`;
      const data = await api.get(url);
      return data.result;
    },
    enabled,
    keepPreviousData: true,
    onError: () => toastError("Failed to load expenses"),
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ isEdit, id, formData }) => {
      const payload = {
        category: formData.category,
        description: formData.description?.trim() || "",
        amount: Number(formData.amount),
        date: formData.date,
        recurring: formData.recurring || false,
        recurringFrequency: formData.recurring ? formData.recurringFrequency : null,
      };

      if (isEdit && id) {
        return api.patch(`/expenses/${id}`, payload);
      }
      return api.post("/expenses", payload);
    },

    onSuccess: () => {
      toastSuccess("Expense saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },

    onError: (err) => {
      const msg = err?.response?.data?.message || "Failed to save expense";
      toastError(msg);
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      toastSuccess("Expense deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      document.getElementById("delete-confirmation-modal")?.close();
    },
    onError: () => toastError("Failed to delete expense!"),
  });
};