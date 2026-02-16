import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  UserRoleCreate,
  UserRoleParams,
  UserRoleUpdate,
  UserRoleExportParams,
} from "@/types/central/user-role";
import { userRoleService } from "@/services/central/user-role.service";
import { downloadBlob } from "@/lib/utils";

export const userRoleQueryKeys = createQueryKeys("userRoles");

export const useUserRoles = (params?: UserRoleParams) => {
  return useQuery({
    queryKey: userRoleQueryKeys.list(params || {}),
    queryFn: () => userRoleService.getUserRoles(params),
  });
};

export const useUserRole = (id?: string) => {
  return useQuery({
    queryKey: userRoleQueryKeys.detail(id || ""),
    queryFn: () => userRoleService.getUserRole(id!),
    enabled: !!id,
  });
};

export const useCreateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userRole: UserRoleCreate) =>
      userRoleService.createUserRole(userRole),
    onSuccess: () => {
      toast.success("User role created successfully");
      queryClient.removeQueries({
        queryKey: [...userRoleQueryKeys.all, "active"],
        exact: false,
      });
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create user role"),
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserRoleUpdate }) =>
      userRoleService.updateUserRole(id, data),
    onSuccess: () => {
      toast.success("User role updated successfully");
      queryClient.removeQueries({
        queryKey: [...userRoleQueryKeys.all, "active"],
        exact: false,
      });
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update user role"),
  });
};

export const useDeleteUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userRoleService.deleteUserRole(id),
    onSuccess: () => {
      toast.success("User role deleted successfully");
      queryClient.removeQueries({
        queryKey: [...userRoleQueryKeys.all, "active"],
        exact: false,
      });
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete user role"),
  });
};

export const useActiveUserRoles = (
  search?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [...userRoleQueryKeys.all, "active", { search }] as const,
    queryFn: () => userRoleService.getActiveRoles(search),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useExportUserRoles = () => {
  return useMutation({
    mutationFn: async (params: UserRoleExportParams) => {
      const blob = await userRoleService.exportUserRoles(params);
      const fileExtension = params.format === "excel" ? "xlsx" : params.format;
      const fileName = `user-roles_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.${fileExtension}`;
      downloadBlob(blob, fileName);
    },
    onSuccess: (_, variables) => {
      toast.success(
        `User roles exported as ${variables.format.toUpperCase()} successfully`
      );
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export user roles"),
  });
};
