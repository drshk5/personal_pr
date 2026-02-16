import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Vendor,
  VendorCreate,
  VendorListResponse,
  VendorParams,
  VendorSimple,
  VendorTypeActiveParams,
  VendorUpdate,
  VendorWithAddresses,
} from "@/types/Account/vendor";
import { api } from "@/lib/api/axios";

export const vendorService = {
  getVendors: async (
    params: VendorParams = {}
  ): Promise<VendorListResponse> => {
    return await ApiService.getWithMeta<VendorListResponse>(
      `${ACCOUNT_API_PREFIX}/Party`,
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getVendor: async (id: string): Promise<Vendor> => {
    return await ApiService.get<Vendor>(`${ACCOUNT_API_PREFIX}/Party/${id}`);
  },

  getVendorWithAddresses: async (id: string): Promise<VendorWithAddresses> => {
    return await ApiService.get<VendorWithAddresses>(
      `${ACCOUNT_API_PREFIX}/Party/${id}`
    );
  },

  createVendor: async (
    vendor: VendorCreate,
    files?: File[]
  ): Promise<VendorSimple> => {
    const formData = new FormData();
    const sanitizedVendor = Object.fromEntries(
      Object.entries(vendor).map(([key, value]) => [key, value ?? null])
    );
    const jsonString = JSON.stringify(sanitizedVendor);
    formData.append("partyData", jsonString);

    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }

    const response = await api.post<{ data: VendorSimple }>(
      `${ACCOUNT_API_PREFIX}/Party`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.data;
  },

  updateVendor: async (
    id: string,
    vendor: VendorUpdate,
    files?: File[],
    strRemoveDocumentAssociationGUIDs?: string[]
  ): Promise<VendorSimple> => {
    const formData = new FormData();
    // Sanitize vendor data: replace undefined with null for consistent JSON serialization
    const sanitizedVendor = Object.fromEntries(
      Object.entries(vendor).map(([key, value]) => [key, value ?? null])
    );
    formData.append("partyData", JSON.stringify(sanitizedVendor));

    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }

    if (
      strRemoveDocumentAssociationGUIDs &&
      strRemoveDocumentAssociationGUIDs.length > 0
    ) {
      strRemoveDocumentAssociationGUIDs.forEach((guid) => {
        formData.append("strRemoveDocumentAssociationGUIDs", guid);
      });
    }

    const response = await api.put<{ data: VendorSimple }>(
      `${ACCOUNT_API_PREFIX}/Party/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.data;
  },

  deleteVendor: async (id: string): Promise<void> => {
    return await ApiService.delete(`${ACCOUNT_API_PREFIX}/Party/${id}`);
  },

  // Get active vendors by type (for dropdowns)
  getActiveVendorsByType: async (
    params: VendorTypeActiveParams
  ): Promise<Vendor[]> => {
    return await ApiService.get<Vendor[]>(
      `${ACCOUNT_API_PREFIX}/Party/type-active`,
      {
        search: params.search,
        strPartyType: params.strPartyType,
      }
    );
  },
};
