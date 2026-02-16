import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  PaymentReceipt,
  PaymentReceiptCreate,
  PaymentReceiptListResponse,
  PaymentReceiptParams,
  PaymentReceiptChangeStatusRequest,
  PaymentReceiptDropdownItem,
  PaymentReceiptDropdownParams,
  PaymentReceiptUpdate,
} from "@/types/Account/payment-receipt";

const mapPaymentReceiptListResponse = (
  response: unknown
): PaymentReceiptListResponse => {
  const payload = (response ?? {}) as Record<string, unknown>;

  const rawItems =
    (payload.data as unknown) ?? payload.items ?? payload.Items ?? [];

  const items = Array.isArray(rawItems) ? (rawItems as PaymentReceipt[]) : [];

  const totalCount = Number(
    payload.totalRecords ?? payload.totalCount ?? items.length
  );

  return {
    items,
    totalCount,
    pageNumber: (payload.pageNumber as number) ?? 1,
    pageSize: (payload.pageSize as number) ?? (items.length || 10),
    totalPages: (payload.totalPages as number) ?? 1,
    hasPreviousPage:
      (payload.hasPreviousPage as boolean) ??
      (payload.hasPrevious as boolean) ??
      false,
    hasNextPage:
      (payload.hasNextPage as boolean) ?? (payload.hasNext as boolean) ?? false,
    statusCode: payload.statusCode as number,
    succeeded: payload.succeeded as boolean,
    message: payload.message as string,
    errors: payload.errors as unknown[],
  };
};

export const paymentReceiptService = {
  getPaymentReceipts: async (
    params: PaymentReceiptParams = {}
  ): Promise<PaymentReceiptListResponse> => {
    const response = await ApiService.getWithMeta<unknown>(
      `${ACCOUNT_API_PREFIX}/PaymentReceipt`,
      formatPaginationParams({
        ...params,
      })
    );

    return mapPaymentReceiptListResponse(response);
  },

  getPendingApprovalPaymentReceipts: async (
    params: PaymentReceiptParams = {}
  ): Promise<PaymentReceiptListResponse> => {
    const response = await ApiService.getWithMeta<unknown>(
      `${ACCOUNT_API_PREFIX}/PaymentReceipt/pending-approval`,
      formatPaginationParams({
        ...params,
        sortBy: params.sortBy || "dtTransactionDate",
        ascending: params.ascending === undefined ? false : params.ascending,
      })
    );

    return mapPaymentReceiptListResponse(response);
  },

  getPaymentReceipt: async (id: string): Promise<PaymentReceipt> => {
    return await ApiService.get<PaymentReceipt>(
      `${ACCOUNT_API_PREFIX}/PaymentReceipt/${id}`
    );
  },

  createPaymentReceipt: async (
    paymentReceipt: PaymentReceiptCreate,
    files?: File[]
  ): Promise<PaymentReceipt> => {
    const formData = new FormData();
    formData.append("paymentReceiptData", JSON.stringify(paymentReceipt));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    return await api
      .post(`${ACCOUNT_API_PREFIX}/PaymentReceipt`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data.data);
  },

  updatePaymentReceipt: async (
    id: string,
    paymentReceipt: PaymentReceiptUpdate,
    files?: File[],
    removeDocumentIds?: string[]
  ): Promise<PaymentReceipt> => {
    const formData = new FormData();
    formData.append("paymentReceiptData", JSON.stringify(paymentReceipt));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    if (removeDocumentIds && removeDocumentIds.length > 0) {
      removeDocumentIds.forEach((guid) =>
        formData.append("strRemoveDocumentAssociationGUIDs", guid)
      );
    }

    return await api
      .put(`${ACCOUNT_API_PREFIX}/PaymentReceipt/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data.data);
  },

  deletePaymentReceipt: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${ACCOUNT_API_PREFIX}/PaymentReceipt/${id}`);
    return true;
  },

  getPaymentReceiptsDropdown: async (
    params: PaymentReceiptDropdownParams = {}
  ): Promise<PaymentReceiptDropdownItem[]> => {
    const searchParams = new URLSearchParams();
    if (params.search) {
      searchParams.append("search", params.search);
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `${ACCOUNT_API_PREFIX}/PaymentReceipt/Dropdown?${queryString}`
      : `${ACCOUNT_API_PREFIX}/PaymentReceipt/Dropdown`;

    return await ApiService.get<PaymentReceiptDropdownItem[]>(url);
  },

  changeStatus: async (
    request: PaymentReceiptChangeStatusRequest
  ): Promise<boolean> => {
    await ApiService.patch<void>(
      `${ACCOUNT_API_PREFIX}/PaymentReceipt/status`,
      request
    );
    return true;
  },
};
