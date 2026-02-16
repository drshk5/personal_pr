import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  JournalVoucher,
  JournalVoucherCreate,
  JournalVoucherListResponse,
  JournalVoucherParams,
  JournalVoucherUpdate,
  JournalVoucherDropdownItem,
  JournalVoucherDropdownParams,
  JournalVoucherSimple,
  PendingApprovalParams,
  BulkChangeStatusRequest,
} from "@/types/Account/journal-voucher";

const JOURNAL_VOUCHER_API_PREFIX = ACCOUNT_API_PREFIX + "/JournalVoucher";

export const journalVoucherService = {
  getJournalVouchers: async (
    params: JournalVoucherParams = {}
  ): Promise<JournalVoucherListResponse> => {
    return await ApiService.getWithMeta<JournalVoucherListResponse>(
      `${JOURNAL_VOUCHER_API_PREFIX}`,
      formatPaginationParams({
        ...params,
      })
    );
  },

  getPendingApproval: async (
    params: PendingApprovalParams = {}
  ): Promise<JournalVoucherListResponse> => {
    return await ApiService.getWithMeta<JournalVoucherListResponse>(
      `${JOURNAL_VOUCHER_API_PREFIX}/pending-approval`,
      formatPaginationParams({
        ...params,
      })
    );
  },

  getJournalVoucher: async (id: string): Promise<JournalVoucher> => {
    return await ApiService.get<JournalVoucher>(
      `${JOURNAL_VOUCHER_API_PREFIX}/${id}`
    );
  },

  getJournalVouchersDropdown: async (
    params: JournalVoucherDropdownParams = {}
  ): Promise<JournalVoucherDropdownItem[]> => {
    const searchParams = new URLSearchParams();
    if (params.search) {
      searchParams.append("search", params.search);
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `${JOURNAL_VOUCHER_API_PREFIX}/Dropdown?${queryString}`
      : `${JOURNAL_VOUCHER_API_PREFIX}/Dropdown`;

    return await ApiService.get<JournalVoucherDropdownItem[]>(url);
  },

  createJournalVoucher: async (
    journalVoucher: JournalVoucherCreate,
    files?: File[]
  ): Promise<JournalVoucherSimple> => {
    const formData = new FormData();
    formData.append("voucherData", JSON.stringify(journalVoucher));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    return await api
      .post(`${JOURNAL_VOUCHER_API_PREFIX}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data.data);
  },

  updateJournalVoucher: async (
    id: string,
    journalVoucher: JournalVoucherUpdate,
    files?: File[],
    removeDocumentIds?: string[]
  ): Promise<JournalVoucherSimple> => {
    const formData = new FormData();
    formData.append("voucherData", JSON.stringify(journalVoucher));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    if (removeDocumentIds && removeDocumentIds.length > 0) {
      // Backend expects Guid[] array named strRemoveDocumentAssociationGUIDs
      removeDocumentIds.forEach((guid) =>
        formData.append("strRemoveDocumentAssociationGUIDs", guid)
      );
    }

    return await api
      .put(`${JOURNAL_VOUCHER_API_PREFIX}/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data.data);
  },

  deleteJournalVoucher: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${JOURNAL_VOUCHER_API_PREFIX}/${id}`);
    return true;
  },

  bulkChangeStatus: async (request: BulkChangeStatusRequest): Promise<void> => {
    return await ApiService.patch<void>(
      `${JOURNAL_VOUCHER_API_PREFIX}/status`,
      request
    );
  },
};
