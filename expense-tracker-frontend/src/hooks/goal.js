import api from "@/lib/api";
import { toastSuccess, toastError } from "@/lib/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetGoals = () => {
  return useQuery({
    queryKey: ["savingsGoals"],
    queryFn: async () => {
      const { result } = await api.get("/savings-goals");
      return result || [];
    },
    staleTime: 30000,
    onError: (err) => {
      const message = err?.response?.data?.message || err?.message || "Failed to load goals";
      toastError(message);
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ isEdit, id, formData }) => {
      const payload = {
        title: formData.title?.trim(),
        targetAmount: Number(formData.targetAmount),
        currentAmount: formData.currentAmount ? Number(formData.currentAmount) : 0,
        deadline: formData.deadline || null,
        icon: formData.icon || "🎯",
        color: formData.color || "#10b981",
        recurring: !!formData.recurring,
        recurringAmount: formData.recurring ? Number(formData.recurringAmount) || 0 : 0,
        recurringFrequency: formData.recurring ? (formData.recurringFrequency || "monthly") : "monthly",
      };

      if (isEdit && id) {
        return api.patch(`/savings-goals/${id}`, payload);
      }
      return api.post("/savings-goals", payload);
    },
    onSuccess: (data, variables) => {
      const message = variables.isEdit ? "Goal updated successfully!" : "Goal created successfully!";
      toastSuccess(message);
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
    },
    onError: (err) => {
      const message = err?.response?.data?.message || err?.message || "Failed to save goal";
      toastError(message);
    },
  });
};

export const useAddToGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }) => {
      if (!id || !amount || amount <= 0) {
        throw new Error("Invalid amount");
      }
      return api.post(`/savings-goals/${id}/add`, { amount: Number(amount) });
    },
    onSuccess: () => {
      toastSuccess("Amount added successfully!");
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
    },
    onError: (err) => {
      const message = err?.response?.data?.message || err?.message || "Failed to add amount";
      toastError(message);
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!id) {
        throw new Error("Goal ID is required");
      }
      return api.delete(`/savings-goals/${id}`);
    },
    onSuccess: () => {
      toastSuccess("Goal deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
    },
    onError: (err) => {
      const message = err?.response?.data?.message || err?.message || "Failed to delete goal";
      toastError(message);
    },
  });
};
