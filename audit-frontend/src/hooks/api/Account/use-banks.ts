import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type { BankCreate, BankParams, BankUpdate } from "@/types/Account/bank";
import { bankService } from "@/services/Account/bank.service";

export const bankQueryKeys = createQueryKeys("banks");

export const useBanks = (params?: BankParams) => {
  return useQuery({
    queryKey: bankQueryKeys.list(params || {}),
    queryFn: () => bankService.getBanks(params),
  });
};

export const useBank = (id?: string) => {
  return useQuery({
    queryKey: bankQueryKeys.detail(id || ""),
    queryFn: () => bankService.getBank(id!),
    enabled: !!id,
  });
};

export const useCreateBank = () => {
  return useMutation({
    mutationFn: (bank: BankCreate) => bankService.createBank(bank),
    onSuccess: async () => {
      toast.success("Bank created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create bank"),
  });
};

export const useUpdateBank = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BankUpdate }) =>
      bankService.updateBank(id, data),
    onSuccess: async () => {
      toast.success("Bank updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update bank"),
  });
};

export const useDeleteBank = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string }) => bankService.deleteBank(id),
    onSuccess: async () => {
      toast.success("Bank deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete bank"),
  });
};

export const useActiveBanks = (search?: string) => {
  return useQuery({
    queryKey: search
      ? [...bankQueryKeys.all, "active", search]
      : [...bankQueryKeys.all, "active"],
    queryFn: () => bankService.getActiveBanks(search),
  });
};
