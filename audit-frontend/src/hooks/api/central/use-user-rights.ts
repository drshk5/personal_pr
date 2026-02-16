import { UserRightsService } from "@/services/central/user-rights.service";
import type {
  UserRightsParams,
  UserRightsBatchRequest,
} from "@/types/central/user-rights";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { useRef } from "react";
import { useAuthContext } from "@/hooks/common";
import { useToken } from "@/hooks/common/use-token";

export const userRightsQueryKeys = createQueryKeys("user-rights");
export const userMenuRightsQueryKeys = createQueryKeys("user-menu-rights");
export const userRightsTreeQueryKeys = createQueryKeys("user-rights-tree");

export const useUserMenuRights = () => {
  const user = useAuthContext();
  const { hasToken } = useToken();
  const lastFetchRef = useRef<number>(0);

  return useQuery({
    queryKey: userMenuRightsQueryKeys.detail("user-menu-rights"),
    queryFn: async () => {
      // Rate limiting: prevent excessive calls within 2 seconds
      const now = Date.now();
      if (now - lastFetchRef.current < 2000) {
        throw new Error("Rate limited");
      }
      lastFetchRef.current = now;

      const response = await UserRightsService.getUserMenuRights();

      if (response?.data) {
        const menuItems = response.data;
        const sidebarItems = menuItems.filter(
          (item) => item.strMenuPosition === "sidebar"
        );

        // Fix menu positions if no sidebar items found
        if (sidebarItems.length === 0 && menuItems.length > 0) {
          return UserRightsService.fixMenuPositions([...menuItems]);
        }

        return menuItems;
      }

      return response?.data || [];
    },
    enabled: Boolean(user) && hasToken,
    refetchOnWindowFocus: true,
  });
};

export const useUserRightsTree = (params?: UserRightsParams) => {
  return useQuery({
    queryKey: userRightsTreeQueryKeys.list(params || {}),
    queryFn: () => UserRightsService.getUserRightsTree(params),
  });
};

export const useBatchUpsertUserRights = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userRights: UserRightsBatchRequest }) => {
      return UserRightsService.batchUpsertUserRights(data.userRights);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userRightsTreeQueryKeys.lists(),
      });
      toast.success("User rights updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update user rights"),
  });
};
