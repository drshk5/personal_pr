import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  PurchaseInvoice,
  PurchaseInvoiceCreate,
  PurchaseInvoiceUpdate,
  PurchaseInvoiceParams,
  PurchaseInvoicePendingApprovalParams,
  PurchaseInvoiceChangeStatusRequest,
  PurchaseInvoiceListResponse,
  PurchaseInvoiceSimpleResponse,
  PurchaseInvoicePrintResponse,
  VendorPendingPurchaseInvoiceParams,
  PurchaseInvoicePendingPaymentResponse,
  PurchaseInvoiceDropdownItem,
} from "@/types/Account/purchase-invoice";

export const purchaseInvoiceService = {
  getPurchaseInvoices: async (
    params: PurchaseInvoiceParams = {}
  ): Promise<PurchaseInvoiceListResponse> => {
    return await ApiService.getWithMeta<PurchaseInvoiceListResponse>(
      `${ACCOUNT_API_PREFIX}/PurchaseInvoice`,
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getPendingApprovalPurchaseInvoices: async (
    params: PurchaseInvoicePendingApprovalParams = {}
  ): Promise<PurchaseInvoiceListResponse> => {
    return await ApiService.getWithMeta<PurchaseInvoiceListResponse>(
      `${ACCOUNT_API_PREFIX}/PurchaseInvoice/pending-approval`,
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getPurchaseInvoice: async (id: string): Promise<PurchaseInvoice> => {
    return await ApiService.get<PurchaseInvoice>(
      `${ACCOUNT_API_PREFIX}/PurchaseInvoice/${id}`
    );
  },

  getPurchaseInvoicePrint: async (
    id: string
  ): Promise<PurchaseInvoicePrintResponse> => {
    return await ApiService.get<PurchaseInvoicePrintResponse>(
      `${ACCOUNT_API_PREFIX}/PurchaseInvoice/print/${id}`
    );
  },

  getPendingPaymentsByVendor: async (
    params: VendorPendingPurchaseInvoiceParams
  ): Promise<PurchaseInvoicePendingPaymentResponse> => {
    return await ApiService.get<PurchaseInvoicePendingPaymentResponse>(
      `${ACCOUNT_API_PREFIX}/PurchaseInvoice/PendingPurchaseInvoicesForVendor`,
      { strVendorGUID: params.strVendorGUID }
    );
  },
  getPurchaseInvoicesDropdown: async (params?: {
    search?: string;
  }): Promise<PurchaseInvoiceDropdownItem[]> => {
    const searchParams = new URLSearchParams();
    if (params?.search) {
      searchParams.append("search", params.search);
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `${ACCOUNT_API_PREFIX}/PurchaseInvoice/Dropdown?${queryString}`
      : `${ACCOUNT_API_PREFIX}/PurchaseInvoice/Dropdown`;

    return await ApiService.get<PurchaseInvoiceDropdownItem[]>(url);
  },
  createPurchaseInvoice: async (
    purchaseInvoice: PurchaseInvoiceCreate,
    files?: File[]
  ): Promise<PurchaseInvoiceSimpleResponse> => {
    const formData = new FormData();
    formData.append("purchaseInvoiceData", JSON.stringify(purchaseInvoice));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    const response = await api.post<PurchaseInvoiceSimpleResponse>(
      `${ACCOUNT_API_PREFIX}/PurchaseInvoice`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  updatePurchaseInvoice: async (
    id: string,
    purchaseInvoice: PurchaseInvoiceUpdate,
    files?: File[],
    removeDocumentIds?: string[]
  ): Promise<PurchaseInvoiceSimpleResponse> => {
    const formData = new FormData();
    formData.append("purchaseInvoiceData", JSON.stringify(purchaseInvoice));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    if (removeDocumentIds && removeDocumentIds.length > 0) {
      removeDocumentIds.forEach((guid) =>
        formData.append("strRemoveDocumentAssociationGUIDs", guid)
      );
    }

    const response = await api.put<PurchaseInvoiceSimpleResponse>(
      `${ACCOUNT_API_PREFIX}/PurchaseInvoice/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  deletePurchaseInvoice: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(
      `${ACCOUNT_API_PREFIX}/PurchaseInvoice/${id}`
    );
    return true;
  },

  changeStatus: async (
    request: PurchaseInvoiceChangeStatusRequest
  ): Promise<boolean> => {
    await ApiService.patch<void>(
      `${ACCOUNT_API_PREFIX}/PurchaseInvoice/status`,
      request
    );
    return true;
  },
};
