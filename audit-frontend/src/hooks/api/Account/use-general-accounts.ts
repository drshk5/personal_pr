import { useMutation, useQuery } from "@tanstack/react-query";
import { generalAccountService } from "@/services/Account/general-account.service";
import type {
  GeneralAccountCreate,
  GeneralAccountParams,
  GeneralAccountUpdate,
} from "@/types/Account/general-account";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

const generalAccountQueryKeys = createQueryKeys("general-accounts");

export const useGeneralAccounts = (params?: GeneralAccountParams) => {
  return useQuery({
    queryKey: generalAccountQueryKeys.list(params || {}),
    queryFn: () => generalAccountService.getGeneralAccounts(params),
  });
};

export const useActiveAccounts = () => {
  return useQuery({
    queryKey: generalAccountQueryKeys.list({ bolIsActive: true }),
    queryFn: () =>
      generalAccountService.getGeneralAccounts({ bolIsActive: true }),
  });
};

export const useGeneralAccount = (id?: string) => {
  return useQuery({
    queryKey: generalAccountQueryKeys.detail(id || ""),
    queryFn: () => generalAccountService.getGeneralAccount(id!),
    enabled: !!id,
  });
};

export const useCreateGeneralAccount = () => {
  return useMutation({
    mutationFn: (generalAccount: GeneralAccountCreate) =>
      generalAccountService.createGeneralAccount(generalAccount),
    onSuccess: async () => {
      toast.success("General Account created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create general account"),
  });
};

export const useUpdateGeneralAccount = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GeneralAccountUpdate }) =>
      generalAccountService.updateGeneralAccount(id, data),
    onSuccess: async () => {
      toast.success("General Account updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update general account"),
  });
};

export const useDeleteGeneralAccount = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      generalAccountService.deleteGeneralAccount(id),
    onSuccess: async () => {
      toast.success("General Account deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete general account"),
  });
};
