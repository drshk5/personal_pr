import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  JournalVoucherRecurringProfile,
  JournalVoucherRecurringProfileCreate,
  JournalVoucherRecurringProfileListResponse,
  JournalVoucherRecurringProfileParams,
  JournalVoucherRecurringProfileUpdate,
} from "@/types/Account/journal-voucher-recurring";

const JOURNAL_VOUCHER_RECURRING_PROFILE_API_PREFIX =
  ACCOUNT_API_PREFIX + "/JournalVoucherRecurringProfile";

export const journalVoucherRecurringProfileService = {
  // Returns paginated response with metadata (flat format: data = array, pagination at root)
  getAll: async (
    params: JournalVoucherRecurringProfileParams = {}
  ): Promise<JournalVoucherRecurringProfileListResponse> => {
    const response = await api.get<JournalVoucherRecurringProfileListResponse>(
      JOURNAL_VOUCHER_RECURRING_PROFILE_API_PREFIX,
      {
        params: formatPaginationParams({ ...params }),
      }
    );
    return response.data;
  },

  // Returns single profile from data wrapper
  getById: async (id: string): Promise<JournalVoucherRecurringProfile> => {
    return await ApiService.get<JournalVoucherRecurringProfile>(
      `${JOURNAL_VOUCHER_RECURRING_PROFILE_API_PREFIX}/${id}`
    );
  },

  // Creates profile and returns data wrapper
  create: async (
    profile: JournalVoucherRecurringProfileCreate
  ): Promise<JournalVoucherRecurringProfile> => {
    return await ApiService.post<JournalVoucherRecurringProfile>(
      JOURNAL_VOUCHER_RECURRING_PROFILE_API_PREFIX,
      profile
    );
  },

  // Updates profile and returns data wrapper
  update: async (
    id: string,
    profile: JournalVoucherRecurringProfileUpdate
  ): Promise<JournalVoucherRecurringProfile> => {
    return await ApiService.put<JournalVoucherRecurringProfile>(
      `${JOURNAL_VOUCHER_RECURRING_PROFILE_API_PREFIX}/${id}`,
      profile
    );
  },

  // Deletes profile
  delete: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(
      `${JOURNAL_VOUCHER_RECURRING_PROFILE_API_PREFIX}/${id}`
    );
    return true;
  },
};
