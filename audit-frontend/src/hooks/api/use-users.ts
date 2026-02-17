import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { BackendPagedResponse } from "@/types/common";

export interface UserDto {
  strUserGUID: string;
  strFullName?: string;
  strUserName: string;
  strEmail?: string;
  bolIsActive: boolean;
}

export const useUsers = (params?: { bolIsActive?: boolean }) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const response = await api.get<BackendPagedResponse<UserDto[]>>("/users", {
        params,
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
