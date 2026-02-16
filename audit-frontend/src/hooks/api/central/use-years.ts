import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type { YearCreate, YearParams, YearUpdate } from "@/types/central/year";
import { yearService } from "@/services/central/year.service";
import { downloadBlob } from "@/lib/utils";

const yearQueryKeys = createQueryKeys("years");
const yearsByOrgQueryKeys = createQueryKeys("yearsByOrganization");

export { yearQueryKeys, yearsByOrgQueryKeys };

export const useYears = (params?: YearParams) => {
  return useQuery({
    queryKey: yearQueryKeys.list(params || {}),
    queryFn: () => yearService.getYears(params),
  });
};

export const useYear = (id?: string) => {
  return useQuery({
    queryKey: yearQueryKeys.detail(id || ""),
    queryFn: () => yearService.getYear(id!),
    enabled: !!id,
  });
};

export const useYearsByOrganization = (
  organizationId: string | undefined,
  options?: { enabled?: boolean }
) => {
  const isEnabled =
    options?.enabled !== undefined
      ? options.enabled && !!organizationId
      : !!organizationId;

  return useQuery({
    queryKey: yearsByOrgQueryKeys.detail(organizationId || ""),
    queryFn: () =>
      organizationId
        ? yearService.getYearsByOrganization(organizationId)
        : Promise.resolve([]),
    enabled: isEnabled,
  });
};

export const useCreateYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (year: YearCreate) => yearService.createYear(year),
    onSuccess: () => {
      toast.success("Year created successfully");
      queryClient.removeQueries({
        queryKey: [...yearsByOrgQueryKeys.all, "active"],
        exact: false,
      });
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create year");
    },
  });
};

export const useUpdateYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, year }: { id: string; year: YearUpdate }) =>
      yearService.updateYear(id, year),
    onSuccess: () => {
      toast.success("Year updated successfully");
      queryClient.removeQueries({
        queryKey: [...yearsByOrgQueryKeys.all, "active"],
        exact: false,
      });
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update year");
    },
  });
};

export const useDeleteYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => yearService.deleteYear(id),
    onSuccess: () => {
      toast.success("Year deleted successfully");
      queryClient.removeQueries({
        queryKey: [...yearsByOrgQueryKeys.all, "active"],
        exact: false,
      });
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete year");
    },
  });
};

export const useActiveYearsByOrganization = (
  organizationId: string | undefined,
  excludeYearId?: string,
  options?: { enabled?: boolean }
) => {
  const isEnabled =
    options?.enabled !== undefined
      ? !!organizationId && !!options.enabled
      : !!organizationId;

  return useQuery({
    queryKey: [
      ...yearsByOrgQueryKeys.all,
      "active",
      organizationId,
      excludeYearId || "",
    ],
    queryFn: () =>
      organizationId
        ? yearService.getActiveYearsByOrganization(
            organizationId,
            excludeYearId
          )
        : Promise.resolve([]),
    enabled: isEnabled,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useYearsByOrganizationAndUser = (organizationId?: string) => {
  return useQuery({
    queryKey: [...yearsByOrgQueryKeys.all, "user", organizationId || ""],
    queryFn: () => yearService.getYearsByOrganizationAndUser(organizationId!),
    enabled: !!organizationId,
  });
};

export const useExportYears = () => {
  return useMutation<void, Error, { format: "excel" | "csv" }>({
    mutationFn: async (params: { format: "excel" | "csv" }) => {
      const blob = await yearService.exportYears(params);
      const fileExtension = params.format === "excel" ? "xlsx" : params.format;
      const fileName = `years_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.${fileExtension}`;
      downloadBlob(blob, fileName);
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Years exported as ${variables.format.toUpperCase()} successfully`
      );
    },
    onError: (error: Error) => {
      handleMutationError(error, "Failed to export years");
    },
  });
};
