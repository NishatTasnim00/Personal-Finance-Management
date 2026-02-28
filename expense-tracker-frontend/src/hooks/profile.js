import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const useGetProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { result } = await api.get("/user/profile");
      return result;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
};