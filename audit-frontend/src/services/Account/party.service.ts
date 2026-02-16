import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Party,
  PartyCreate,
  PartyListResponse,
  PartyParams,
  PartySimple,
  PartyTypeActiveParams,
  PartyTypeActiveResponse,
  PartyUpdate,
  PartyWithLocations,
  UpdateBillingAndShippingAddress,
  PartyDropdown,
} from "@/types/Account/party";
import { api } from "@/lib/api/axios";

export const partyService = {
  getParties: async (
    params: Partial<PartyParams> = {}
  ): Promise<PartyListResponse> => {
    return await ApiService.getWithMeta<PartyListResponse>(
      `${ACCOUNT_API_PREFIX}/Party`,
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getParty: async (id: string): Promise<Party> => {
    return await ApiService.get<Party>(`${ACCOUNT_API_PREFIX}/Party/${id}`);
  },

  getPartyWithLocations: async (id: string): Promise<PartyWithLocations> => {
    return await ApiService.get<PartyWithLocations>(
      `${ACCOUNT_API_PREFIX}/Party/${id}/with-addresses`
    );
  },

  createParty: async (
    party: PartyCreate,
    files?: File[]
  ): Promise<PartySimple> => {
    const formData = new FormData();
    formData.append("partyData", JSON.stringify(party));

    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }

    const response = await api.post<{ data: PartySimple }>(
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

  updateParty: async (
    id: string,
    party: PartyUpdate,
    files?: File[],
    strRemoveDocumentAssociationGUIDs?: string[]
  ): Promise<PartySimple> => {
    const formData = new FormData();
    formData.append("partyData", JSON.stringify(party));

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

    const response = await api.put<{ data: PartySimple }>(
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

  deleteParty: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${ACCOUNT_API_PREFIX}/Party/${id}`);
    return true;
  },

  getActivePartiesByType: async (
    params: PartyTypeActiveParams
  ): Promise<PartyTypeActiveResponse> => {
    return await ApiService.get<PartyTypeActiveResponse>(
      `${ACCOUNT_API_PREFIX}/Party/type-active`,
      {
        search: params.search,
        strPartyType: params.strPartyType,
      }
    );
  },

  updateBillingAndShippingAddress: async (
    partyGUID: string,
    data: UpdateBillingAndShippingAddress
  ): Promise<PartySimple> => {
    return await ApiService.put<PartySimple>(
      `${ACCOUNT_API_PREFIX}/Party/${partyGUID}/billing-shipping-address`,
      data
    );
  },

  getDropdown: async (
    search?: string,
    partyType?: string
  ): Promise<PartyDropdown[]> => {
    return await ApiService.get<PartyDropdown[]>(
      `${ACCOUNT_API_PREFIX}/Party/Dropdown`,
      {
        search,
        partyType,
      }
    );
  },

  getCustomerDropdown: async (search?: string): Promise<PartyDropdown[]> => {
    return await ApiService.get<PartyDropdown[]>(
      `${ACCOUNT_API_PREFIX}/Party/Customer/Dropdown`,
      {
        search,
      }
    );
  },

  getVendorDropdown: async (search?: string): Promise<PartyDropdown[]> => {
    return await ApiService.get<PartyDropdown[]>(
      `${ACCOUNT_API_PREFIX}/Party/Vendor/Dropdown`,
      {
        search,
      }
    );
  },
};
