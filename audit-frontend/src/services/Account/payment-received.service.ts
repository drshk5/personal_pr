import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  PaymentReceived,
  PaymentReceivedFilterParams,
  PaymentReceivedPendingApprovalFilterParams,
  PaymentReceivedChangeStatusRequest,
  PaymentReceivedDropdown,
  PaymentReceivedFormData,
  CreatePaymentReceivedDto,
  UpdatePaymentReceivedDto,
  PaymentReceivedListResponse,
} from "@/types/Account/payment-received";

export const paymentReceivedService = {
  getAll: async (
    params: PaymentReceivedFilterParams = {}
  ): Promise<PaymentReceivedListResponse> => {
    const formattedParams = formatPaginationParams({
      ...params,
      sortBy: params.sortBy || "dPaymentReceivedDate",
    });

    return await ApiService.getWithMeta<PaymentReceivedListResponse>(
      "/accounting/PaymentReceived",
      formattedParams
    );
  },

  getById: async (id: string): Promise<PaymentReceived> => {
    return await ApiService.get<PaymentReceived>(
      `/accounting/PaymentReceived/${id}`
    );
  },

  getDropdown: async (search?: string): Promise<PaymentReceivedDropdown[]> => {
    const params = search ? { search } : {};
    const response = await ApiService.get<PaymentReceivedDropdown[]>(
      "/accounting/PaymentReceived/Dropdown",
      params
    );
    return response;
  },

  getPendingApproval: async (
    params: PaymentReceivedPendingApprovalFilterParams = {}
  ): Promise<PaymentReceivedListResponse> => {
    const formattedParams = formatPaginationParams({
      ...params,
      sortBy: params.sortBy || "dPaymentReceivedDate",
    });

    return await ApiService.getWithMeta<PaymentReceivedListResponse>(
      "/accounting/PaymentReceived/pending-approval",
      formattedParams
    );
  },

  /**
   * Create new payment received record with optional file upload
   */
  create: async (data: PaymentReceivedFormData): Promise<PaymentReceived> => {
    const formData = new FormData();
    const statusToSend = data.strStatus ?? "Draft";

    // Create the DTO without files
    const dto: CreatePaymentReceivedDto = {
      dPaymentReceivedDate: data.dPaymentReceivedDate,
      strCustomerGUID: data.strCustomerGUID,
      strAccountGUID: data.strAccountGUID,
      strRefNo: data.strRefNo,
      strPaymentMode: data.strPaymentMode,
      strSubject: data.strSubject,
      dblBankCharges: data.dblBankCharges || 0,
      dblTotalAmountReceived: data.dblTotalAmountReceived,
      strNotes: data.strNotes,
      dtExchangeRateDate: data.dtExchangeRateDate,
      dblExchangeRate: data.dblExchangeRate || 1,
      strCurrencyTypeGUID: data.strCurrencyTypeGUID,
      Items: data.Items,
      strStatus: statusToSend,
    };

    // Append the JSON data
    formData.append("paymentReceivedData", JSON.stringify(dto));

    // Append files if any
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append("files", file);
      });
    }

    return await ApiService.post<PaymentReceived>(
      "/accounting/PaymentReceived",
      formData
    );
  },

  update: async (
    id: string,
    data: PaymentReceivedFormData
  ): Promise<PaymentReceived> => {
    const formData = new FormData();
    const statusToSend = data.strStatus ?? "Draft";

    // Create the DTO without files
    const dto: UpdatePaymentReceivedDto = {
      dPaymentReceivedDate: data.dPaymentReceivedDate,
      strCustomerGUID: data.strCustomerGUID,
      strAccountGUID: data.strAccountGUID,
      strRefNo: data.strRefNo,
      strPaymentMode: data.strPaymentMode,
      strSubject: data.strSubject,
      dblBankCharges: data.dblBankCharges || 0,
      dblTotalAmountReceived: data.dblTotalAmountReceived,
      strNotes: data.strNotes,
      dtExchangeRateDate: data.dtExchangeRateDate,
      dblExchangeRate: data.dblExchangeRate || 1,
      strCurrencyTypeGUID: data.strCurrencyTypeGUID,
      Items: data.Items,
      strRemovePaymentReceivedItemGUIDs: data.strRemoveDocumentAssociationGUIDs,
      strStatus: statusToSend,
    };

    formData.append("paymentReceivedData", JSON.stringify(dto));

    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append("files", file);
      });
    }

    if (
      data.strRemoveDocumentAssociationGUIDs &&
      data.strRemoveDocumentAssociationGUIDs.length > 0
    ) {
      data.strRemoveDocumentAssociationGUIDs.forEach((guid) => {
        formData.append("strRemoveDocumentAssociationGUIDs", guid);
      });
    }

    return await ApiService.put<PaymentReceived>(
      `/accounting/PaymentReceived/${id}`,
      formData
    );
  },

  delete: async (id: string): Promise<void> => {
    return await ApiService.delete(`/accounting/PaymentReceived/${id}`);
  },

  changeStatus: async (
    request: PaymentReceivedChangeStatusRequest
  ): Promise<void> => {
    return await ApiService.patch(
      "/accounting/PaymentReceived/status",
      request
    );
  },

  getPrint: async (id: string): Promise<unknown> => {
    return await ApiService.get(`/accounting/PaymentReceived/print/${id}`);
  },

  getDocumentTypes: async (): Promise<unknown> => {
    return await ApiService.get(
      "/accounting/PaymentReceived/debug/document-types"
    );
  },
};
