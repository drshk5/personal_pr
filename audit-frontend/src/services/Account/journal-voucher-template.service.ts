import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";

import type {
  JournalVoucherTemplateDetail,
  JournalVoucherTemplateCreate,
  JournalVoucherTemplateListResponse,
  JournalVoucherTemplateParams,
  JournalVoucherTemplateUpdate,
  JournalVoucherTemplateDropdownItem,
  JournalVoucherTemplateDropdownParams,
} from "@/types/Account/journal-voucher-template";

const JOURNAL_VOUCHER_TEMPLATE_API_PREFIX =
  ACCOUNT_API_PREFIX + "/JournalVoucherTemplate";

export const journalVoucherTemplateService = {
  getJournalVoucherTemplates: async (
    params: JournalVoucherTemplateParams = {}
  ): Promise<JournalVoucherTemplateListResponse> => {
    return await ApiService.getWithMeta<JournalVoucherTemplateListResponse>(
      `${JOURNAL_VOUCHER_TEMPLATE_API_PREFIX}`,
      formatPaginationParams({
        ...params,
      })
    );
  },

  getJournalVoucherTemplate: async (
    id: string
  ): Promise<JournalVoucherTemplateDetail> => {
    return await ApiService.get<JournalVoucherTemplateDetail>(
      `${JOURNAL_VOUCHER_TEMPLATE_API_PREFIX}/${id}`
    );
  },

  getJournalVoucherTemplatesDropdown: async (
    params: JournalVoucherTemplateDropdownParams = {}
  ): Promise<JournalVoucherTemplateDropdownItem[]> => {
    const searchParams = new URLSearchParams();
    if (params.search) {
      searchParams.append("search", params.search);
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `${JOURNAL_VOUCHER_TEMPLATE_API_PREFIX}/Dropdown?${queryString}`
      : `${JOURNAL_VOUCHER_TEMPLATE_API_PREFIX}/Dropdown`;

    return await ApiService.get<JournalVoucherTemplateDropdownItem[]>(url);
  },

  createJournalVoucherTemplate: async (
    journalVoucherTemplate: JournalVoucherTemplateCreate
  ): Promise<JournalVoucherTemplateDetail> => {
    return await ApiService.post<JournalVoucherTemplateDetail>(
      `${JOURNAL_VOUCHER_TEMPLATE_API_PREFIX}`,
      journalVoucherTemplate
    );
  },

  updateJournalVoucherTemplate: async (
    id: string,
    journalVoucherTemplate: JournalVoucherTemplateUpdate
  ): Promise<JournalVoucherTemplateDetail> => {
    return await ApiService.put<JournalVoucherTemplateDetail>(
      `${JOURNAL_VOUCHER_TEMPLATE_API_PREFIX}/${id}`,
      journalVoucherTemplate
    );
  },

  deleteJournalVoucherTemplate: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(
      `${JOURNAL_VOUCHER_TEMPLATE_API_PREFIX}/${id}`
    );
    return true;
  },
};
