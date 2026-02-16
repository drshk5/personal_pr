import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type { UnitCreate, UnitParams, UnitUpdate } from "@/types/Account/unit";
import { unitService } from "@/services/Account/unit.service";

export const unitQueryKeys = createQueryKeys("units");
const unitActiveKey = ["units", "active"];

export const useUnits = (params?: UnitParams, enabled = true) => {
  return useQuery({
    queryKey: unitQueryKeys.list(params || {}),
    queryFn: () => unitService.getUnits(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUnit = (id?: string) => {
  return useQuery({
    queryKey: unitQueryKeys.detail(id || ""),
    queryFn: () => unitService.getUnit(id!),
    enabled: !!id,
  });
};

export const useActiveUnits = (enabled: boolean = true) => {
  return useQuery({
    queryKey: unitActiveKey,
    queryFn: () => unitService.getActiveUnits(),
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useCreateUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (unit: UnitCreate) => unitService.createUnit(unit),
    onSuccess: async () => {
      toast.success("Unit created successfully");
      queryClient.invalidateQueries({ queryKey: unitQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: unitActiveKey });
    },
    onError: (error) => handleMutationError(error, "Failed to create unit"),
  });
};

export const useUpdateUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UnitUpdate }) =>
      unitService.updateUnit(id, data),
    onSuccess: async () => {
      toast.success("Unit updated successfully");
      queryClient.invalidateQueries({ queryKey: unitQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: unitActiveKey });
    },
    onError: (error) => handleMutationError(error, "Failed to update unit"),
  });
};

export const useDeleteUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => unitService.deleteUnit(id),
    onSuccess: async () => {
      toast.success("Unit deleted successfully");
      queryClient.invalidateQueries({ queryKey: unitQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: unitActiveKey });
    },
    onError: (error) => handleMutationError(error, "Failed to delete unit"),
  });
};
