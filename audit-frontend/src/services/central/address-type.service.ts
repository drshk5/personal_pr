import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type { BaseListParams } from "@/types";
import type {
  AddressType,
  AddressTypeCreate,
  AddressTypeListResponse,
  AddressTypeSimple,
  AddressTypeUpdate,
  AddressTypeExportParams,
} from "@/types/central/address-type";

export const addressTypeService = {
  getAddressTypes: async (
    params: BaseListParams = {}
  ): Promise<AddressTypeListResponse> => {
    return await ApiService.getWithMeta<AddressTypeListResponse>(
      "/AddressType",
      formatPaginationParams({
        ...params,
      })
    );
  },

  getAddressType: async (id: string): Promise<AddressType> => {
    return await ApiService.get<AddressType>(`/AddressType/${id}`);
  },

  createAddressType: async (
    addressType: AddressTypeCreate
  ): Promise<AddressType> => {
    return await ApiService.post<AddressType>("/AddressType", addressType);
  },

  updateAddressType: async (
    id: string,
    addressType: AddressTypeUpdate
  ): Promise<AddressType> => {
    return await ApiService.put<AddressType>(`/AddressType/${id}`, addressType);
  },

  getActiveAddressTypes: async (
    search?: string
  ): Promise<AddressTypeSimple[]> => {
    return await ApiService.get<AddressTypeSimple[]>("/AddressType/active", {
      search: search,
    });
  },

  deleteAddressType: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/AddressType/${id}`);
    return true;
  },

  exportAddressTypes: async (
    params: AddressTypeExportParams
  ): Promise<Blob> => {
    return await ApiService.exportFile(
      "/AddressType/export",
      {},
      params.format
    );
  },
};
