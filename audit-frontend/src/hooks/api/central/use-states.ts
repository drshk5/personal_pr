import {
  useMutation,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { stateService } from "@/services/central/state.service";
import type {
  StateCreate,
  StateExportParams,
  StateParams,
  StateUpdate,
  StateSimple,
} from "@/types/central/state";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const stateQueryKeys = createQueryKeys("states");

export const useImportStates = () => {
  return useMutation({
    mutationFn: (file: File) => stateService.importStates(file),
    onSuccess: (data) => {
      toast.success(
        `Import completed successfully. ${data.SuccessCount} states imported, ${data.FailureCount} states already exists.`
      );
    },
    onError: (error) => {
      handleMutationError(error, "Failed to import states");
    },
  });
};

export const useStates = (params?: StateParams) => {
  return useQuery({
    queryKey: stateQueryKeys.list(params || {}),
    queryFn: () => stateService.getStates(params),
  });
};

export const useState = (id?: string) => {
  return useQuery({
    queryKey: stateQueryKeys.detail(id || ""),
    queryFn: () => stateService.getState(id!),
    enabled: !!id,
  });
};

export const useCreateState = () => {
  return useMutation({
    mutationFn: (state: StateCreate) => stateService.createState(state),
    onSuccess: () => {
      toast.success("State created successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create state");
    },
  });
};

export const useUpdateState = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StateUpdate }) =>
      stateService.updateState(id, data),
    onSuccess: () => {
      toast.success("State updated successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update state");
    },
  });
};

export const useDeleteState = () => {
  return useMutation({
    mutationFn: (id: string) => stateService.deleteState(id),
    onSuccess: () => {
      toast.success("State deleted successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete state");
    },
  });
};

export const useStatesByCountry = (
  countryId?: string,
  search?: string,
  options?: Partial<UseQueryOptions<StateSimple[]>>
) => {
  return useQuery<StateSimple[]>({
    queryKey: [...stateQueryKeys.all, "by-country", countryId, search],
    queryFn: () =>
      countryId
        ? stateService.getStatesByCountry(countryId, search)
        : Promise.resolve([]),
    enabled: (options?.enabled ?? true) && !!countryId,
    ...options,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  });
};

export const useActiveStates = (search?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...stateQueryKeys.all, "active", search],
    queryFn: () => stateService.getActiveStates(search),
    enabled,
  });
};

export const useExportStates = () => {
  return useMutation({
    mutationFn: (params: StateExportParams) =>
      stateService.exportStates(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `states_${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `States exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to export states");
    },
  });
};
