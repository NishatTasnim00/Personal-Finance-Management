import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toastError } from "@/lib/toast";

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
      const data  = await api.get(url);
      console.log(data);
      return data.result;
    },
    enabled,
    keepPreviousData: true,
    onError: () => toastError("Failed to load incomes"),
  });
};