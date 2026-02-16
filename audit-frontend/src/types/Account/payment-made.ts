import type { ApiResponse } from "../common";

export interface PaymentMadeItem {
  strPurchaseInvoiceGUID: string;
  dtPaymentMadeOn: string;
  dblPaymentAmount: number;
  dPurchaseInvoiceDate?: string;
  strPurchaseInvoiceNo?: string;
  dblPurchaseInvoiceAmount?: number;
  dblPendingAmount?: number;
  dblUnProcessedAmount?: number;
}

export interface PaymentMadeItemResponse {
  strPaymentMade_ItemGUID: string;
  strPurchaseInvoiceGUID: string;
  strPurchaseInvoiceNo?: string;
  dPurchaseInvoiceDate?: string;
  dtPaymentMadeOn: string;
  dblPaymentAmount: number;
  dblPurchaseInvoiceAmount?: number;
  dblProcessedAmount?: number;
  dblUnProcessedAmount?: number;
  dblPendingAmount?: number;
}

export interface PaymentMadeFileDto {
  strDocumentGUID: string;
  strDocumentAssociationGUID?: string | null;
  strFileName?: string | null;
  strFileType?: string | null;
  strFilePath?: string | null;
  strFileSize?: string | null;
}

export interface PaymentMadeBase {
  dtPaymentMadeDate: string;
  strStatus?: string;
  strVendorGUID: string;
  strAccountGUID: string;
  strRefNo?: string | null;
  strPaymentMode: string;
  strSubject?: string | null;
  dblTotalAmountMade: number;
  strNotes?: string | null;
  dtExchangeRateDate?: string | null;
  dblExchangeRate?: number;
  strCurrencyTypeGUID?: string | null;
}

export interface CreatePaymentMadeDto extends PaymentMadeBase {
  Items: PaymentMadeItem[];
}

export interface UpdatePaymentMadeDto extends PaymentMadeBase {
  Items: PaymentMadeItem[];
}

export interface PaymentMade {
  strPaymentMadeGUID: string;
  strPaymentMadeNo: string;
  dtPaymentMadeDate: string;
  strVendorGUID: string;
  strVendorName?: string;
  strAccountGUID: string;
  strAccountName?: string;
  strPaymentMode: string;
  strSubject?: string;
  strStatus: string;
  strRefNo?: string;
  strNotes?: string;
  dtExchangeRateDate?: string;
  dblExchangeRate: number;
  dblTotalAmountMade: number;
  dblTotalAmountMadeBase: number;
  strCurrencyTypeGUID?: string | null;
  dblProcessedAmount: number;
  dblUnProcessedAmount: number;
  strApprovedByGUID?: string;
  strApprovedByName?: string;
  dtApprovedOn?: string;
  strRejectedByGUID?: string;
  strRejectedByName?: string;
  dtRejectedOn?: string;
  strRejectedReason?: string;
  dtCreatedOn: string;
  strCreatedByName?: string;
  dtUpdatedOn?: string;
  strUpdatedByName?: string;
  Items: PaymentMadeItemResponse[];
  strFiles?: PaymentMadeFileDto[];
}

export interface PaymentMadeDropdown {
  strPaymentMadeGUID: string;
  strPaymentMadeNo: string;
  dtPaymentMadeDate: string;
  strVendorName: string;
  strStatus: string;
  dblTotalAmountMade: number;
}

export interface PaymentMadeFilterParams {
  fromDate?: string;
  toDate?: string;
  strStatus?: string;
  strVendorGUID?: string;
  strAccountGUID?: string;
  strPaymentMode?: string;
  search?: string;
  strCreatedByGUID?: string;
  strUpdatedByGUID?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  ascending?: boolean;
}

export interface PaymentMadePendingApprovalFilterParams {
  fromDate?: string;
  toDate?: string;
  strPaymentMode?: string;
  strVendorGUID?: string;
  strAccountGUID?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  ascending?: boolean;
}

export interface PaymentMadeChangeStatusRequest {
  strPaymentMadeGUIDs: string[];
  strStatus: string;
  strRejectedReason?: string | null;
}

export interface PaymentMadeFormData extends PaymentMadeBase {
  Items: PaymentMadeItem[];
  files?: File[];
  strRemoveDocumentAssociationGUIDs?: string[];
  strStatus?: string; // Add status to match backend DTO
}

export interface PaymentMadeItemPrint {
  strPaymentMade_ItemGUID: string;
  strPaymentMadeGUID: string;
  strPurchaseInvoiceGUID?: string;
  strPurchaseInvoiceNo?: string;
  dtPurchaseInvoiceDate?: string;
  strFormattedPurchaseInvoiceDate?: string;
  dtPaymentMadeOn: string;
  strFormattedPaymentMadeOn?: string;
  dblPaymentAmount: number;
  dblInvoiceAmount?: number;
  dblPreviouslyPaid?: number;
  dblBalanceDue?: number;
  strOrganizationGUID: string;
  strGroupGUID: string;
  dtCreatedOn: string;
}

export interface PaymentMadePrint {
  strPaymentMadeGUID: string;
  strPaymentMadeNo: string;
  intPaymentMadeSeqNo: number;
  dtPaymentMadeDate: string;
  strFormattedPaymentMadeDate?: string;
  strRefNo?: string;
  strStatus?: string;
  strSubject?: string;
  strVendorGUID: string;
  strVendorName?: string;
  strVendorAccountName?: string;
  strVendorEmail?: string;
  strVendorPhone?: string;
  strVendorPAN?: string;
  strVendorGSTNo?: string;
  strVendorUDFCode?: string;
  strAccountGUID: string;
  strAccountName?: string;
  strAccountUDFCode?: string;
  strPaymentMode: string;
  strPaymentModeName?: string;
  dblTotalAmountMade: number;
  dblTotalAmountMadeBase: number;
  strTotalAmountInWords?: string;
  strCurrencyTypeGUID?: string;
  strCurrencyName?: string;
  dblExchangeRate: number;
  dtExchangeRateDate?: string;
  Items?: PaymentMadeItemPrint[];
  strNotes?: string;
  dtCreatedOn: string;
  strCreatedByName?: string;
  dtApprovedOn?: string;
  strApprovedByName?: string;
  dtRejectedOn?: string;
  strRejectedByName?: string;
  strRejectedReason?: string;
  strYearGUID: string;
  strYearName?: string;
  strOrganizationGUID?: string;
  strLogo?: string;
  strOrganizationName?: string;
  strDescription?: string;
}

export type PaymentMadeListResponse = {
  data: PaymentMade[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type PaymentMadeResponse = ApiResponse<PaymentMade>;
export type PaymentMadeDropdownResponse = ApiResponse<PaymentMadeDropdown[]>;
export type PaymentMadeStatusChangeResponse = ApiResponse<void>;
export type PaymentMadePrintResponse = ApiResponse<PaymentMadePrint>;
