import { useMutation, useQuery } from "@tanstack/react-query";
import { masterMenuService } from "@/services/central/master-menu.service";
import type {
  MasterMenuCreate,
  MasterMenuParams,
  MasterMenuUpdate,
  MasterMenuParent,
  MasterMenuGroupModule,
} from "@/types/central/master-menu";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const masterMenuQueryKeys = createQueryKeys("masterMenus");

export const useMasterMenus = (params?: MasterMenuParams) => {
  return useQuery({
    queryKey: masterMenuQueryKeys.list(params || {}),
    queryFn: () => masterMenuService.getMasterMenus(params),
  });
};

export const useMasterMenu = (id?: string) => {
  return useQuery({
    queryKey: masterMenuQueryKeys.detail(id || ""),
    queryFn: () => masterMenuService.getMasterMenu(id!),
    enabled: !!id,
  });
};

export const useParentMasterMenus = (
  menuGUID?: string,
  search?: string,
  enabled: boolean = true
) => {
  const parentMenusKey = [
    ...masterMenuQueryKeys.all,
    "parent",
    menuGUID,
    search,
  ];

  return useQuery<MasterMenuParent[]>({
    queryKey: parentMenusKey,
    queryFn: () => masterMenuService.getParentMasterMenus(menuGUID, search),
    enabled,
  });
};

export const useMenuCategories = (search?: string) => {
  const categoriesKey = [...masterMenuQueryKeys.all, "categories", search];

  return useQuery<{ value: string; label: string }[]>({
    queryKey: categoriesKey,
    queryFn: () => masterMenuService.getMenuCategories(search),
  });
};

export const useCreateMasterMenu = () => {
  return useMutation({
    mutationFn: (masterMenu: MasterMenuCreate) =>
      masterMenuService.createMasterMenu(masterMenu),
    onSuccess: () => {
      toast.success("Master menu created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create master menu"),
  });
};

export const useUpdateMasterMenu = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MasterMenuUpdate }) =>
      masterMenuService.updateMasterMenu(id, data),
    onSuccess: () => {
      toast.success("Master menu updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update master menu"),
  });
};

export const useDeleteMasterMenu = () => {
  return useMutation({
    mutationFn: (id: string) => masterMenuService.deleteMasterMenu(id),
    onSuccess: () => {
      toast.success("Master menu deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete master menu"),
  });
};

export const useMenusByGroupAndModule = (
  groupGUID?: string,
  moduleGUID?: string
) => {
  const queryKey = [
    ...masterMenuQueryKeys.all,
    "by-group-module",
    groupGUID,
    moduleGUID,
  ];

  return useQuery<MasterMenuGroupModule>({
    queryKey,
    queryFn: () =>
      masterMenuService.getMenusByGroupAndModule({
        strGroupGUID: groupGUID!,
        strModuleGUID: moduleGUID!,
      }),
    enabled: !!groupGUID && !!moduleGUID,
  });
};

export const useExportMasterMenus = () => {
  return useMutation<void, Error, { format: "excel" | "csv" }>({
    mutationFn: async (params: { format: "excel" | "csv" }) => {
      const blob = await masterMenuService.exportMasterMenus(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const extension = params.format === "excel" ? "xlsx" : "csv";
      link.download = `master-menus-${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Master menus exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error) => {
      handleMutationError(error, "Failed to export master menus");
    },
  });
};
