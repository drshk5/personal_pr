import { useMutation, useQuery } from "@tanstack/react-query";
import { menuService } from "@/services/central/menu.service";
import type { MenuRightsBatch } from "@/types/central/menu";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const menuQueryKeys = createQueryKeys("menus");

export const useSearchPages = (
  search?: string,
  options?: { enabled?: boolean }
) => {
  const searchPagesKey = [...menuQueryKeys.all, "searchPages", search];
  return useQuery({
    ...options,
    queryKey: searchPagesKey,
    queryFn: () => menuService.searchPages(search),
  });
};

export const useUpdateBulkMenuRights = () => {
  return useMutation({
    mutationFn: (params: {
      menuRights: MenuRightsBatch[];
      moduleGuid?: string;
      groupGuid?: string;
    }) => {
      if (!params.groupGuid) {
        throw new Error("Group GUID is required to update permissions");
      }
      if (!params.moduleGuid) {
        throw new Error("Please select a module to update permissions");
      }
      return menuService.updateBulkMenuRights(
        params.menuRights,
        params.moduleGuid,
        params.groupGuid
      );
    },
    onSuccess: () => {
      toast.success("Menu rights updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create master menu"),
  });
};
