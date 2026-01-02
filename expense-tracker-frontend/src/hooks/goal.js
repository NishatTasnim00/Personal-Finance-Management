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
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ isEdit, id, formData }) => {
      if (isEdit && id) {
        return api.patch(`/savings-goals/${id}`, formData);
      }
      return api.post("/savings-goals", formData);
    },
    onSuccess: () => {
      toastSuccess("Goal saved!");
      queryClient.invalidateQueries(["savingsGoals"]);
    },
    onError: (err) => toastError(err?.response?.data?.message || err?.message || "Failed to save goal"),
  });
};

export const useAddToGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }) => api.post(`/savings-goals/${id}/add`, { amount }),
    onSuccess: () => {
      toastSuccess("Amount added!");
      queryClient.invalidateQueries(["savingsGoals"]);
    },
    onError: (err) => toastError(err?.response?.data?.message || err?.message || "Failed to add amount"),
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/savings-goals/${id}`),
    onSuccess: () => {
      toastSuccess("Goal deleted");
      queryClient.invalidateQueries(["savingsGoals"]);
    },
    onError: (err) => toastError(err?.response?.data?.message || err?.message || "Failed to delete goal"),
  });
};