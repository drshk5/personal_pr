import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  UserHourlyRateCreate,
  UserHourlyRateUpdate,
  UserHourlyRateParams,
} from "@/types";
import { userHourlyRateService } from "@/services";

export const userHourlyRateQueryKeys = createQueryKeys("userHourlyRates");

export const useUserHourlyRates = (params?: UserHourlyRateParams) => {
  return useQuery({
    queryKey: userHourlyRateQueryKeys.list(params || {}),
    queryFn: () => userHourlyRateService.getUserHourlyRates(params),
  });
};

export const useUserHourlyRate = (guid?: string) => {
  return useQuery({
    queryKey: userHourlyRateQueryKeys.detail(guid || ""),
    queryFn: () => userHourlyRateService.getUserHourlyRate(guid!),
    enabled: !!guid,
  });
};

export const useActiveUserHourlyRates = () => {
  return useQuery({
    queryKey: userHourlyRateQueryKeys.list({ type: "active" }),
    queryFn: () => userHourlyRateService.getActiveUserHourlyRates(),
  });
};

export const useCreateUserHourlyRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserHourlyRateCreate) =>
      userHourlyRateService.createUserHourlyRate(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: userHourlyRateQueryKeys.all });
      toast.success("User hourly rate created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create user hourly rate"),
  });
};

export const useUpdateUserHourlyRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      guid,
      data,
    }: {
      guid: string;
      data: UserHourlyRateUpdate;
    }) => userHourlyRateService.updateUserHourlyRate(guid, data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: userHourlyRateQueryKeys.detail(variables.guid),
      });
      queryClient.invalidateQueries({ queryKey: userHourlyRateQueryKeys.all });
      toast.success("User hourly rate updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update user hourly rate"),
  });
};

export const useDeleteUserHourlyRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guid }: { guid: string }) =>
      userHourlyRateService.deleteUserHourlyRate(guid),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: userHourlyRateQueryKeys.all });
      toast.success("User hourly rate deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete user hourly rate"),
  });
};
