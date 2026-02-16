import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userDetailsService } from "@/services/central/user-details.service";
import type {
  UserDetailsCreate,
  UserDetailsParams,
  UserDetailsBulkCreate,
} from "@/types/central/user-details";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { userQueryKeys } from "./use-users";

export const userDetailsQueryKeys = createQueryKeys("userDetails");

export function useUserDetails(params: UserDetailsParams = {}) {
  return useQuery({
    queryKey: userDetailsQueryKeys.list(params),
    queryFn: () => userDetailsService.getUserDetails(params),
  });
}

export function useUserDetail(id: string) {
  return useQuery({
    queryKey: userDetailsQueryKeys.detail(id),
    queryFn: () => userDetailsService.getUserDetail(id),
  });
}

export function useCreateUserDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newUserDetail: UserDetailsCreate) =>
      userDetailsService.createUserDetail(newUserDetail),
    onSuccess: () => {
      toast.success("Team member updated successfully");
      queryClient.removeQueries({ queryKey: [...userQueryKeys.all, "module"] });
    },
    onError: (error) => handleMutationError(error, "Failed to add team member"),
  });
}

export function useDeleteUserDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userDetailsService.deleteUserDetail(id),
    onSuccess: () => {
      toast.success("Team member removed successfully");
      queryClient.removeQueries({ queryKey: [...userQueryKeys.all, "module"] });
    },
    onError: (error) =>
      handleMutationError(error, "Failed to remove team member"),
  });
}

export function useBulkCreateUserDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bulkData: UserDetailsBulkCreate) =>
      userDetailsService.bulkCreateUserDetails(bulkData),
    onSuccess: (data) => {
      if (data.failureCount > 0) {
        toast.warning(
          `Bulk operation completed with ${data.successCount} success and ${data.failureCount} failures`
        );
      } else {
        toast.success(`Successfully added ${data.successCount} team member(s)`);
      }
      queryClient.removeQueries({ queryKey: [...userQueryKeys.all, "module"] });
    },
    onError: (error) =>
      handleMutationError(error, "Failed to bulk add team members"),
  });
}
