import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  PaymentMade,
  PaymentMadeFilterParams,
  PaymentMadePendingApprovalFilterParams,
  PaymentMadeChangeStatusRequest,
  PaymentMadeDropdown,
  PaymentMadeFormData,
  CreatePaymentMadeDto,
  UpdatePaymentMadeDto,
  PaymentMadeListResponse,
} from "@/types/Account/payment-made";

export const paymentMadeService = {
  getAll: async (
    params: PaymentMadeFilterParams = {}
  ): Promise<PaymentMadeListResponse> => {
    const formattedParams = formatPaginationParams({
      ...params,
      sortBy: params.sortBy || "dtPaymentMadeDate",
    });

    return await ApiService.getWithMeta<PaymentMadeListResponse>(
      "/accounting/payment-made",
      formattedParams
    );
  },

  getById: async (id: string): Promise<PaymentMade> => {
    return await ApiService.get<PaymentMade>(`/accounting/payment-made/${id}`);
  },

  getDropdown: async (search?: string): Promise<PaymentMadeDropdown[]> => {
    const params = search ? { search } : {};
    const response = await ApiService.get<PaymentMadeDropdown[]>(
      "/accounting/payment-made/dropdown",
      params
    );
    return response;
  },

  getPendingApproval: async (
    params: PaymentMadePendingApprovalFilterParams = {}
  ): Promise<PaymentMadeListResponse> => {
    const formattedParams = formatPaginationParams({
      ...params,
      sortBy: params.sortBy || "dtPaymentMadeDate",
    });

    return await ApiService.getWithMeta<PaymentMadeListResponse>(
      "/accounting/payment-made/pending-approval",
      formattedParams
    );
  },

  /**
   * Create new payment made record with optional file upload
   */
  create: async (data: PaymentMadeFormData): Promise<PaymentMade> => {
    const formData = new FormData();

    // Create the DTO without files
    const dto: CreatePaymentMadeDto = {
      dtPaymentMadeDate: data.dtPaymentMadeDate,
      strVendorGUID: data.strVendorGUID,
      strAccountGUID: data.strAccountGUID,
      strRefNo: data.strRefNo,
      strPaymentMode: data.strPaymentMode,
      strSubject: data.strSubject,
      dblTotalAmountMade: data.dblTotalAmountMade,
      strNotes: data.strNotes,
      dtExchangeRateDate: data.dtExchangeRateDate,
      dblExchangeRate: data.dblExchangeRate || 1,
      strCurrencyTypeGUID: data.strCurrencyTypeGUID,
      strStatus: data.strStatus,
      Items: data.Items,
    };

    // Append the JSON data
    formData.append("paymentMadeData", JSON.stringify(dto));

    // Append files if any
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append("files", file);
      });
    }

    return await ApiService.post<PaymentMade>(
      "/accounting/payment-made",
      formData
    );
  },

  update: async (
    id: string,
    data: PaymentMadeFormData
  ): Promise<PaymentMade> => {
    const formData = new FormData();

    // Create the DTO without files
    const dto: UpdatePaymentMadeDto = {
      dtPaymentMadeDate: data.dtPaymentMadeDate,
      strVendorGUID: data.strVendorGUID,
      strAccountGUID: data.strAccountGUID,
      strRefNo: data.strRefNo,
      strPaymentMode: data.strPaymentMode,
      strSubject: data.strSubject,
      dblTotalAmountMade: data.dblTotalAmountMade,
      strNotes: data.strNotes,
      dtExchangeRateDate: data.dtExchangeRateDate,
      dblExchangeRate: data.dblExchangeRate || 1,
      strCurrencyTypeGUID: data.strCurrencyTypeGUID,
      strStatus: data.strStatus,
      Items: data.Items,
    };

    formData.append("paymentMadeData", JSON.stringify(dto));

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

    return await ApiService.put<PaymentMade>(
      `/accounting/payment-made/${id}`,
      formData
    );
  },

  delete: async (id: string): Promise<void> => {
    return await ApiService.delete(`/accounting/payment-made/${id}`);
  },

  changeStatus: async (
    request: PaymentMadeChangeStatusRequest
  ): Promise<void> => {
    return await ApiService.patch("/accounting/payment-made/status", request);
  },

  getPrint: async (id: string): Promise<unknown> => {
    return await ApiService.get(`/accounting/payment-made/print/${id}`);
  },
};
