import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  OrganizationParams,
  UpdateOrganizationDto,
  CreateOrganizationDto,
  ExchangeRateParams,
  Organization,
} from "@/types/central/organization";
import { exchangeRateService, organizationService } from "@/services";
import { downloadBlob } from "@/lib/utils";
import { clearReactQueryPersistence } from "@/lib/utils/app-state-utils";

export const organizationQueryKeys = createQueryKeys("organizations");
const activeOrganizationsKey = [...organizationQueryKeys.all, "active"];
const parentOrganizationsKey = [...organizationQueryKeys.all, "parent"];

export const useOrganizations = (params?: OrganizationParams) => {
  return useQuery({
    queryKey: organizationQueryKeys.list(params || {}),
    queryFn: () => organizationService.getOrganizations(params),
  });
};

export const useOrganization = (id?: string) => {
  return useQuery({
    queryKey: organizationQueryKeys.detail(id || ""),
    queryFn: () => organizationService.getOrganization(id!),
    enabled: !!id,
  });
};

export const useActiveOrganizations = (
  options?: Omit<UseQueryOptions<Organization[]>, "queryKey" | "queryFn">
) => {
  return useQuery<Organization[]>({
    queryKey: activeOrganizationsKey,
    queryFn: () => organizationService.getActiveOrganizations(),
    staleTime: 24 * 60 * 60 * 1000,
    ...options,
  });
};

export const useParentOrganizations = (
  strOrganizationGUID: string,
  search?: string
) => {
  return useQuery({
    queryKey: [...parentOrganizationsKey, strOrganizationGUID, search],
    queryFn: async () => {
      const response = await organizationService.getParentOrganizations(
        strOrganizationGUID,
        search
      );
      return response.data ?? [];
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organization: CreateOrganizationDto) =>
      organizationService.createOrganization(organization),
    onSuccess: () => {
      toast.success("Organization created successfully");
      queryClient.removeQueries({
        queryKey: activeOrganizationsKey,
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: parentOrganizationsKey,
        exact: false,
      });
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create organization");
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationDto }) =>
      organizationService.updateOrganization(id, data),
    onSuccess: () => {
      toast.success("Organization updated successfully");
      queryClient.removeQueries({
        queryKey: activeOrganizationsKey,
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: parentOrganizationsKey,
        exact: false,
      });
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update organization");
    },
  });
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => organizationService.deleteOrganization(id),
    onSuccess: () => {
      toast.success("Organization deleted successfully");
      queryClient.removeQueries({
        queryKey: activeOrganizationsKey,
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: parentOrganizationsKey,
        exact: false,
      });
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete organization");
    },
  });
};

export const useSwitchOrganization = (autoNavigate: boolean = true) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { organizationId: string; yearId?: string }) => {
      sessionStorage.setItem("orgSwitch", "true");

      const timestamp = Date.now().toString();
      sessionStorage.setItem("lastContextUpdateTime", timestamp);

      await organizationService.switchOrganization(
        params.organizationId,
        params.yearId
      );

      return params;
    },
    onSuccess: async () => {
      await clearReactQueryPersistence(queryClient);
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-menu-rights"] });
      queryClient.invalidateQueries({ queryKey: ["user-rights"] });
      queryClient.invalidateQueries({ queryKey: ["help-center"] });

      toast.success(`Successfully switched organization`, {
        duration: 3000,
      });

      if (autoNavigate) {
        navigate("/welcome", { replace: true });
      }

      setTimeout(() => {
        sessionStorage.removeItem("orgSwitch");
      }, 1000);
    },
    onError: (error) => {
      sessionStorage.removeItem("orgSwitch");

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to switch organization";
      toast.error(errorMessage);
    },
  });
};

export const useUserOrganizations = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["user-organizations"],
    queryFn: () => organizationService.getUserOrganizations(),
    ...options,
  });
};

export const useExportOrganizations = () => {
  return useMutation<void, Error, { format: "excel" | "csv" }>({
    mutationFn: async (params: { format: "excel" | "csv" }) => {
      const blob = await organizationService.exportOrganizations(params);
      const fileExtension = params.format === "excel" ? "xlsx" : params.format;
      const fileName = `organizations_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.${fileExtension}`;
      downloadBlob(blob, fileName);
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Organizations exported as ${variables.format.toUpperCase()} successfully`
      );
    },
    onError: (error: Error) => {
      handleMutationError(error, "Failed to export organizations");
    },
  });
};

export const useExchangeRate = (
  params: ExchangeRateParams,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: ["exchangeRate", params.strFromCurrencyGUID],
    queryFn: () => exchangeRateService.getExchangeRate(params),
    enabled: options?.enabled ?? !!params.strFromCurrencyGUID,
  });
};
