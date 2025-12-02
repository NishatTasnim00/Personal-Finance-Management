import api from "@/lib/api";
import { toastSuccess, toastError } from "@/lib/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetIncomes = ({
  period,
  startDate,
  endDate,
  source,
  enabled = true,
}) => {
  return useQuery({
    queryKey: [
      "incomes",
      period,
      period === "custom" ? startDate : null,
      period === "custom" ? endDate : null,
      source,
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

      if (source) params.append("source", source);

      const url = `/incomes${params.toString() ? `?${params.toString()}` : ""}`;
      const data = await api.get(url);
      return data.result;
    },
    enabled,
    keepPreviousData: true,
    onError: () => toastError("Failed to load incomes"),
  });
};

export const useUpdateIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ isEdit, id, formData }) => {
      const payload = {
        source: formData.source,
        description: formData.description?.trim() || "",
        amount: Number(formData.amount),
        date: formData.date.toISOString().split("T")[0],
      };

      if (isEdit && id) {
        return api.patch(`/incomes/${id}`, payload);
      }
      return api.post("/incomes", payload);
    },

    onSuccess: () => {
      toastSuccess("Income saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
    },

    onError: (err) => {
      const msg = err?.response?.data?.message || "Failed to save income";
      toastError(msg);
    },
  });
};

export const useDeleteIncome = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/incomes/${id}`),
    onSuccess: () => {
      toastSuccess("Income data Deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      document.getElementById("delete-confirmation-modal")?.close();
    },
    onError: () => toastError("Failed to delete!"),
  });
};
