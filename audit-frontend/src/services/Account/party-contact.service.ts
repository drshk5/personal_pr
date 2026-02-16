import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  PartyContact,
  PartyContactCreate,
  PartyContactListResponse,
  PartyContactParams,
  PartyContactUpdate,
  PartyContactSimpleResponse,
} from "@/types/Account/party-contact";

export const partyContactService = {
  getPartyContacts: async (
    params: PartyContactParams = {}
  ): Promise<PartyContactListResponse> => {
    return await ApiService.getWithMeta<PartyContactListResponse>(
      `${ACCOUNT_API_PREFIX}/PartyContact`,
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getPartyContact: async (id: string): Promise<PartyContact> => {
    return await ApiService.get<PartyContact>(
      `${ACCOUNT_API_PREFIX}/PartyContact/${id}`
    );
  },

  createPartyContact: async (
    partyContact: PartyContactCreate
  ): Promise<PartyContactSimpleResponse> => {
    return await ApiService.post<PartyContactSimpleResponse>(
      `${ACCOUNT_API_PREFIX}/PartyContact`,
      partyContact
    );
  },

  updatePartyContact: async (
    id: string,
    partyContact: PartyContactUpdate
  ): Promise<PartyContactSimpleResponse> => {
    return await ApiService.put<PartyContactSimpleResponse>(
      `${ACCOUNT_API_PREFIX}/PartyContact/${id}`,
      partyContact
    );
  },

  deletePartyContact: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${ACCOUNT_API_PREFIX}/PartyContact/${id}`);
    return true;
  },
};
