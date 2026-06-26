import { useQuery } from "@tanstack/react-query";
import { coinsApi } from "@/lib/api/coins";

export const useParentBalance = () =>
  useQuery({
    queryKey: ["parent-balance"],
    queryFn: () => coinsApi.parentBalance(),
  });
