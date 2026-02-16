import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/central/user.service";
import type {
  UserCreate,
  UserParams,
  UserUpdate,
  UserByOrgModuleParams,
} from "@/types/central/user";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { format } from "date-fns";
import { downloadBlob } from "@/lib/utils";
import { useToken } from "@/hooks/common/use-token";

export const userQueryKeys = createQueryKeys("users");

export const useUsers = (params?: UserParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: userQueryKeys.list(params || {}),
    queryFn: () => userService.getUsers(params),
    enabled,
  });
};

export const useUser = (id?: string) => {
  const { hasToken } = useToken();

  return useQuery({
    queryKey: userQueryKeys.detail(id || ""),
    queryFn: () => userService.getUser(id!),
    enabled: !!id && hasToken,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: UserCreate) => userService.createUser(user),
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.removeQueries({ queryKey: [...userQueryKeys.all, "module"] });
    },
    onError: (error) => handleMutationError(error, "Failed to create user"),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) =>
      userService.updateUser(id, data),
    onSuccess: (_, { id }) => {
      toast.success("User updated successfully");
      // Invalidate the specific user detail query
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(id) });
      // Remove module user lists
      queryClient.removeQueries({ queryKey: [...userQueryKeys.all, "module"] });
    },
    onError: (error) => handleMutationError(error, "Failed to update user"),
  });
};

export const useActiveUsers = (search?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...userQueryKeys.all, "active", search],
    queryFn: () => userService.getActiveUsers(search),
    enabled,
  });
};

export const useModuleUsers = (
  bolIsActive?: boolean,
  search?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [...userQueryKeys.all, "module", bolIsActive, search],
    queryFn: () => userService.getModuleUsers(bolIsActive, search),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled,
  });
};

export const useUsersByOrganizationModule = (
  params?: UserByOrgModuleParams
) => {
  const { hasToken } = useToken();

  return useQuery({
    queryKey: [...userQueryKeys.all, "by-organization-module", params || {}],
    queryFn: () => userService.getUsersByOrganizationModule(params),
    enabled: hasToken,
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.removeQueries({ queryKey: [...userQueryKeys.all, "module"] });
    },
    onError: (error) => handleMutationError(error, "Failed to delete user"),
  });
};

export const useExportUsers = () => {
  return useMutation({
    mutationFn: async (params: { format: "excel" | "csv" }) => {
      const blob = await userService.exportUsers(params);
      const fileExtension = params.format === "excel" ? "xlsx" : params.format;
      const fileName = `users_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.${fileExtension}`;
      downloadBlob(blob, fileName);
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Users exported as ${variables.format.toUpperCase()} successfully`
      );
    },
    onError: (error) => handleMutationError(error, "Failed to export users"),
  });
};
