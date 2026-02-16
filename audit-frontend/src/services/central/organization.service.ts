import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import { api } from "@/lib/api/axios";
import type {
  Organization,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationListResponse,
  OrganizationParams,
  UserOrganization,
  OrganizationSelectionResponse,
  ExchangeRateResponse,
  ExchangeRateParams,
  ParentOrganizationsResponse,
} from "@/types/central/organization";
import type { User } from "@/types/central/user";

export const organizationService = {
  switchOrganization: async (
    organizationId: string,
    yearId?: string
  ): Promise<OrganizationSelectionResponse> => {
    const response =
      await ApiService.postWithMeta<OrganizationSelectionResponse>(
        "/UserRights/switch-organization",
        {
          strOrganizationGUID: organizationId,
          strYearGUID: yearId,
        }
      );

    const token = response?.data?.token;

    if (token) {
      localStorage.setItem("Token", token);

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    return response;
  },

  updateLastOrganization: async (
    organizationId: string,
    yearId?: string
  ): Promise<OrganizationSelectionResponse> => {
    return organizationService.switchOrganization(organizationId, yearId);
  },

  getOrganizations: async (
    params: OrganizationParams = {}
  ): Promise<OrganizationListResponse> => {
    const formattedParams = formatPaginationParams({
      ...params,
      strIndustryGUID: params.strIndustryGUID,
      strLegalStatusTypeGUID: params.strLegalStatusTypeGUID,
      strParentOrganizationGUID: params.strParentOrganizationGUID,
      strCreatedByGUIDs: params.strCreatedByGUIDs,
      strUpdatedByGUIDs: params.strUpdatedByGUIDs,
      sortBy: params.sortBy || "strOrganizationName",
    });

    return await ApiService.getWithMeta<OrganizationListResponse>(
      "/Organization",
      formattedParams
    );
  },

  getOrganization: async (id: string): Promise<Organization> => {
    return await ApiService.get<Organization>(`/Organization/${id}`);
  },

  createOrganization: async (
    organization: CreateOrganizationDto
  ): Promise<Organization> => {
    const formattedOrganization = {
      bolIsDefaultTaxConfig: true,
      ...organization,
      bolIsTaxApplied: organization.bolIsTaxApplied ?? false, // Use provided value or default to false
      dtClientAcquiredDate: organization.dtClientAcquiredDate
        ? new Date(organization.dtClientAcquiredDate).toISOString()
        : undefined,
      dtStartDate: organization.dtStartDate
        ? new Date(organization.dtStartDate).toISOString().split("T")[0]
        : undefined,
      dtEndDate: organization.dtEndDate
        ? new Date(organization.dtEndDate).toISOString().split("T")[0]
        : undefined,
      dtRegistrationDate: organization.dtRegistrationDate
        ? new Date(organization.dtRegistrationDate).toISOString()
        : undefined,
    };

    const formData = new FormData();

    Object.entries(formattedOrganization).forEach(([key, value]) => {
      if (key === "LogoFile" && value instanceof File) {
        formData.append("LogoFile", value);
      } else if (typeof value === "boolean") {
        formData.append(key, value.toString());
      } else if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    const response = await api.post("/Organization", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  updateOrganization: async (
    id: string,
    organization: UpdateOrganizationDto
  ): Promise<Organization> => {
    const formattedOrganization = {
      bolIsDefaultTaxConfig: true,
      ...organization,
      bolIsTaxApplied: organization.bolIsTaxApplied ?? false, // Use provided value or default to false
      dtClientAcquiredDate: organization.dtClientAcquiredDate
        ? new Date(organization.dtClientAcquiredDate).toISOString()
        : undefined,
      dtRegistrationDate: organization.dtRegistrationDate
        ? new Date(organization.dtRegistrationDate).toISOString()
        : undefined,
    };

    const formData = new FormData();

    Object.entries(formattedOrganization).forEach(([key, value]) => {
      if (key === "LogoFile" && value instanceof File) {
        formData.append("LogoFile", value);
      } else if (typeof value === "boolean") {
        formData.append(key, value.toString());
      } else if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    const response = await api.put(`/Organization/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  deleteOrganization: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/Organization/${id}`);
    return true;
  },

  getUserOrganizations: async (): Promise<UserOrganization[]> => {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/auth/")) {
      return [];
    }

    try {
      const queryClient = window.__QUERY_CLIENT__;
      const cachedUser = queryClient?.getQueryData<User>(["auth", "user"]);

      if (cachedUser && cachedUser.bolIsSuperAdmin) {
        return [];
      }

      return await ApiService.get<UserOrganization[]>(
        "/UserRights/user-organization"
      );
    } catch {
      return [];
    }
  },

  getActiveOrganizations: async (): Promise<Organization[]> => {
    try {
      return await ApiService.get<Organization[]>("/Organization/active");
    } catch {
      return [];
    }
  },

  getParentOrganizations: async (
    strOrganizationGUID: string,
    search?: string
  ): Promise<ParentOrganizationsResponse> => {
    const params: Record<string, string | undefined> = {
      strOrganizationGUID:
        strOrganizationGUID || "00000000-0000-0000-0000-000000000000",
    };

    if (search) {
      params.search = search;
    }

    return await ApiService.getWithMeta<ParentOrganizationsResponse>(
      "/Organization/parent-organization",
      params
    );
  },

  exportOrganizations: async (params: {
    format: "excel" | "csv";
  }): Promise<Blob> => {
    return await ApiService.exportFile(
      "/Organization/export",
      {},
      params.format
    );
  },
};

export const exchangeRateService = {
  getExchangeRate: async (
    params: ExchangeRateParams
  ): Promise<ExchangeRateResponse> => {
    const response = await ApiService.get<ExchangeRateResponse>(
      "/Organization/exchange-rate",
      {
        strFromCurrencyGUID: params.strFromCurrencyGUID,
      }
    );
    return response;
  },
};
