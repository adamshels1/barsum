import { useQuery } from "@tanstack/react-query";
import { coinsApi } from "@/lib/api/coins";

export const useChildBalance = (childId: string) =>
  useQuery({
    queryKey: ["child-balance", childId],
    queryFn: () => coinsApi.childBalance(childId),
    enabled: !!childId,
  });
