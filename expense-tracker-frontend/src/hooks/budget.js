// src/hooks/budget.js
import api from "@/lib/api";
import { toastSuccess, toastError } from "@/lib/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetBudgets = ({ period = "monthly" }) => {
  return useQuery({
    queryKey: ["budgets", period],
    queryFn: async () => {
      const { result } = await api.get(`/budgets?period=${period}`);
      return result;
    },
    onError: () => toastError("Failed to load budgets"),
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ isEdit, id, formData }) => {
      const payload = {
        category: formData.category,
        amount: Number(formData.amount),
        period: formData.period,
      };

      if (isEdit && id) {
        return api.patch(`/budgets/${id}`, payload);
      }
      return api.post("/budgets", payload);
    },
    onSuccess: () => {
      toastSuccess("Budget saved!");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (err) => toastError(err?.response?.data?.message || "Failed to save budget"),
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/budgets/${id}`),
    onSuccess: () => {
      toastSuccess("Budget deleted!");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: () => toastError("Failed to delete budget"),
  });
};