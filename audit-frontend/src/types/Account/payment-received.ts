import type { ApiResponse } from "../common";

export interface PaymentReceivedItem {
  strPaymentReceived_ItemGUID?: string;
  strInvoiceGUID: string;
  dtPaymentReceivedOn: string;
  dblPaymentAmount: number;
  strInvoiceNo?: string;
  dInvoiceDate?: string;
  dblInvoiceAmount?: number;
  dblPendingAmount?: number;
}

export interface PaymentReceivedItemResponse {
  strPaymentReceived_ItemGUID: string;
  strPaymentReceivedGUID: string;
  strInvoiceGUID: string;
  dInvoiceDate?: string;
  dtPaymentReceivedOn: string;
  dblPaymentAmount: number;
  strInvoiceNo?: string;
  dblInvoiceAmount?: number;
  dblProcessedAmount?: number;
  dblUnProcessedAmount?: number;
  dblPendingAmount?: number;
  strYearGUID: string;
  strOrganizationGUID: string;
  strGroupGUID: string;
  strCreatedByGUID: string;
  strCreatedByName?: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string;
  strUpdatedByName?: string;
  dtUpdatedOn?: string;
}

export interface PaymentReceivedFileDto {
  strDocumentGUID: string;
  strDocumentAssociationGUID: string;
  strFileName: string;
  strFileType?: string | null;
  strFilePath?: string | null;
  strFileSize?: string | null;
}

export interface PaymentReceivedBase {
  dPaymentReceivedDate: string;
  strCustomerGUID: string;
  strAccountGUID: string;
  strRefNo?: string | null;
  strPaymentMode: string;
  strSubject?: string | null;
  dblBankCharges?: number;
  dblTotalAmountReceived: number;
  strNotes?: string | null;
  dtExchangeRateDate?: string | null;
  dblExchangeRate?: number;
  strCurrencyTypeGUID?: string | null;
}

export interface CreatePaymentReceivedDto extends PaymentReceivedBase {
  Items: PaymentReceivedItem[];
  strStatus?: string;
}

export interface UpdatePaymentReceivedDto extends PaymentReceivedBase {
  Items: PaymentReceivedItem[];
  strRemovePaymentReceivedItemGUIDs?: string[];
  strStatus?: string;
}

export interface PaymentReceived {
  strPaymentReceivedGUID: string;
  strPaymentReceivedNo: string;
  intPaymentReceivedSeqNo: number;
  dPaymentReceivedDate: string;
  strCustomerGUID: string;
  strAccountGUID: string;
  strRefNo?: string;
  strPaymentMode: string;
  strSubject?: string;
  strStatus: string;
  dblBankCharges: number;
  dblTotalAmountReceived: number;
  dblTotalAmountReceivedBase: number;
  strNotes?: string;
  dtExchangeRateDate?: string;
  dblExchangeRate: number;
  strCurrencyTypeGUID?: string;
  dblNetAmt: number;
  dblProcessedAmount: number;
  dblUnProcessedAmount: number;
  dblPendingAmount: number;
  strCustomerName?: string;
  strAccountName?: string;
  strPaymentModeName?: string;
  strYearGUID: string;
  strYearName?: string;
  strOrganizationGUID: string;
  strGroupGUID: string;
  strCreatedByGUID: string;
  strCreatedByName?: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string;
  strUpdatedByName?: string;
  dtUpdatedOn?: string;
  strApprovedByGUID?: string;
  strApprovedByName?: string;
  dtApprovedOn?: string;
  strRejectedByGUID?: string;
  strRejectedByName?: string;
  dtRejectedOn?: string;
  strRejectedReason?: string;
  Items?: PaymentReceivedItemResponse[];
  strFiles?: PaymentReceivedFileDto[];
}

export interface PaymentReceivedDropdown {
  strPaymentReceivedGUID: string;
  strPaymentReceivedNo: string;
  dPaymentReceivedDate: string;
  strCustomerName: string;
  dblTotalAmountReceived: number;
  strStatus: string;
}

export interface PaymentReceivedFilterParams {
  fromDate?: string;
  toDate?: string;
  strStatus?: string;
  strCustomerGUID?: string;
  strAccountGUID?: string;
  strPaymentMode?: string;
  search?: string;
  strCreatedByGUID?: string;
  strUpdatedByGUID?: string;
  PageNumber?: number;
  PageSize?: number;
  sortBy?: string;
  ascending?: boolean;
}

export interface PaymentReceivedPendingApprovalFilterParams {
  fromDate?: string;
  toDate?: string;
  strPaymentMode?: string;
  strCustomerGUID?: string;
  strAccountGUID?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  ascending?: boolean;
}

export interface PaymentReceivedChangeStatusRequest {
  strPaymentReceivedGUIDs: string[];
  strStatus: string;
  strRejectedReason?: string | null;
}

export interface PaymentReceivedFormData extends PaymentReceivedBase {
  Items: PaymentReceivedItem[];
  files?: File[];
  strRemoveDocumentAssociationGUIDs?: string[];
  strStatus?: string;
}

export interface PaymentReceivedItemPrint {
  strPaymentReceived_ItemGUID: string;
  strPaymentReceivedGUID: string;
  strInvoiceGUID?: string;
  strInvoiceNo?: string;
  dtInvoiceDate?: string;
  strFormattedInvoiceDate?: string;
  dtPaymentReceivedOn: string;
  strFormattedPaymentReceivedOn?: string;
  dblPaymentAmount: number;
  dblPaymentAmountBase: number;
  dblInvoiceAmount?: number;
  dblPreviouslyPaid?: number;
  dblBalanceDue?: number;
  strYearGUID: string;
  strOrganizationGUID: string;
  strGroupGUID: string;
  dtCreatedOn: string;
}

export interface PaymentReceivedPrint {
  strPaymentReceivedGUID: string;
  strPaymentReceivedNo: string;
  intPaymentReceivedSeqNo: number;
  dPaymentReceivedDate: string;
  strFormattedPaymentReceivedDate?: string;
  strRefNo?: string;
  strStatus?: string;
  strSubject?: string;
  strCustomerGUID: string;
  strCustomerName?: string;
  strCustomerAccountName?: string;
  strCustomerEmail?: string;
  strCustomerPhone?: string;
  strCustomerPAN?: string;
  strCustomerGSTNo?: string;
  strCustomerUDFCode?: string;
  strAccountGUID: string;
  strAccountName?: string;
  strAccountUDFCode?: string;
  strPaymentMode: string;
  strPaymentModeName?: string;
  dblBankCharges: number;
  dblTotalAmountReceived: number;
  dblTotalAmountReceivedBase: number;
  strTotalAmountInWords?: string;
  strCurrencyTypeGUID?: string;
  strCurrencyName?: string;
  dblExchangeRate: number;
  dtExchangeRateDate?: string;
  Items?: PaymentReceivedItemPrint[];
  strNotes?: string;
  strYearGUID: string;
  strYearName?: string;
  strOrganizationGUID?: string;
  strLogo?: string;
  strOrganizationName?: string;
  strDescription?: string;
}

export type PaymentReceivedListResponse = {
  data: PaymentReceived[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};
export type PaymentReceivedResponse = ApiResponse<PaymentReceived>;
export type PaymentReceivedDropdownResponse = ApiResponse<
  PaymentReceivedDropdown[]
>;
export type PaymentReceivedStatusChangeResponse = ApiResponse<void>;
export type PaymentReceivedPrintResponse = ApiResponse<PaymentReceivedPrint>;
