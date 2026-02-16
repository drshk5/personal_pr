import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Invoice,
  InvoiceCreate,
  InvoiceUpdate,
  InvoiceParams,
  PendingApprovalParams,
  ChangeStatusRequest,
  InvoiceListResponse,
  InvoiceDropdownItem,
  InvoiceDropdownParams,
  InvoicePrintResponse,
  CustomerPendingInvoiceParams,
  PendingInvoiceByCustomerResponse,
} from "@/types/Account/salesinvoice";

export const invoiceService = {
  getInvoices: async (
    params: InvoiceParams = {}
  ): Promise<InvoiceListResponse> => {
    return await ApiService.getWithMeta<InvoiceListResponse>(
      `${ACCOUNT_API_PREFIX}/Invoice`,
      formatPaginationParams(params as unknown as Record<string, unknown>)
    );
  },

  getPendingApprovalInvoices: async (
    params: PendingApprovalParams = {}
  ): Promise<InvoiceListResponse> => {
    return await ApiService.getWithMeta<InvoiceListResponse>(
      `${ACCOUNT_API_PREFIX}/Invoice/pending-approval`,
      formatPaginationParams(params as unknown as Record<string, unknown>)
    );
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    return await ApiService.get<Invoice>(`${ACCOUNT_API_PREFIX}/Invoice/${id}`);
  },

  getInvoicesDropdown: async (
    params: InvoiceDropdownParams = {}
  ): Promise<InvoiceDropdownItem[]> => {
    const searchParams = new URLSearchParams();
    if (params.search) {
      searchParams.append("search", params.search);
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `${ACCOUNT_API_PREFIX}/Invoice/Dropdown?${queryString}`
      : `${ACCOUNT_API_PREFIX}/Invoice/Dropdown`;

    return await ApiService.get<InvoiceDropdownItem[]>(url);
  },

  createInvoice: async (
    invoice: InvoiceCreate,
    files?: File[]
  ): Promise<Invoice> => {
    const formData = new FormData();
    formData.append("invoiceData", JSON.stringify(invoice));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    const response = await api.post<Invoice>(
      `${ACCOUNT_API_PREFIX}/Invoice`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  updateInvoice: async (
    id: string,
    invoice: InvoiceUpdate,
    files?: File[],
    removeDocumentIds?: string[]
  ): Promise<Invoice> => {
    const formData = new FormData();
    formData.append("invoiceData", JSON.stringify(invoice));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    if (removeDocumentIds && removeDocumentIds.length > 0) {
      removeDocumentIds.forEach((guid) =>
        formData.append("strRemoveDocumentAssociationGUIDs", guid)
      );
    }

    const response = await api.put<Invoice>(
      `${ACCOUNT_API_PREFIX}/Invoice/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  deleteInvoice: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${ACCOUNT_API_PREFIX}/Invoice/${id}`);
    return true;
  },

  changeStatus: async (request: ChangeStatusRequest): Promise<boolean> => {
    await ApiService.patch<void>(
      `${ACCOUNT_API_PREFIX}/Invoice/status`,
      request
    );
    return true;
  },

  getInvoicePrint: async (id: string): Promise<InvoicePrintResponse> => {
    return await ApiService.get<InvoicePrintResponse>(
      `${ACCOUNT_API_PREFIX}/Invoice/print/${id}`
    );
  },

  getPendingInvoicesByCustomer: async (
    params: CustomerPendingInvoiceParams
  ): Promise<PendingInvoiceByCustomerResponse> => {
    return await ApiService.get<PendingInvoiceByCustomerResponse>(
      `${ACCOUNT_API_PREFIX}/Invoice/PendingInvoicesByCustomer`,
      { strCustomerGUID: params.strCustomerGUID }
    );
  },
};
