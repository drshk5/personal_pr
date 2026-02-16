import type { DocumentFile } from "@/types/common";

export interface PaymentReceipt {
  strPaymentReceiptGUID: string;
  strTransactionType: string;
  strTransactionNo: string;
  dtTransactionDate: string;
  strPaymentMode: string;
  strToAccountGUID: string;
  strAccountName?: string | null;
  strPartyName?: string | null;
  dblTotalAmount: number;
  strCurrency?: string | null;
  strCurrencyTypeGUID?: string | null;
  strCurrencyTypeName?: string | null;
  dblExchangeRate: number;
  dblBaseTotalAmount: number;
  dtExchangeRateDate?: string | null;
  strBankCashGUID?: string | null;
  strBankCashAccountName?: string | null;
  strChequeNo?: string | null;
  dtChequeDate?: string | null;
  strCardType?: string | null;
  strCardLastFourDigits?: string | null;
  strCardIssuerBank?: string | null;
  strCardTransactionId?: string | null;
  dblCardProcessingFee?: number | null;
  strStatus: string;
  strApprovedByGUID?: string | null;
  strApprovedByName?: string | null;
  dtApprovedDate?: string | null;
  strRejectionReason?: string | null;
  strReferenceNo?: string | null;
  strNarration?: string | null;
  strOrganizationGUID: string;
  strGroupGUID: string;
  strYearGUID?: string | null;
  strYearName?: string | null;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  dtUpdatedOn?: string | null;
  strCreatedByName?: string | null;
  strUpdatedByName?: string | null;
  strFiles?: DocumentFile[] | null;
}

export interface PaymentReceiptSimple {
  strPaymentReceiptGUID: string;
  strTransactionType: string;
  strTransactionNo: string;
  dtTransactionDate: string;
  strPaymentMode: string;
  strToAccountGUID: string;
  strAccountName?: string | null;
  dblTotalAmount: number;
  strStatus: string;
}

export interface PaymentReceiptCreate {
  strTransactionType: string;
  dtTransactionDate: string;
  strPaymentMode: string;
  strToAccountGUID: string;
  dblTotalAmount: number;
  strStatus?: string;
  strCurrencyTypeGUID?: string | null;
  dblExchangeRate?: number;
  dblBaseTotalAmount: number;
  dtExchangeRateDate?: string | null;
  strBankCashGUID?: string | null;
  strChequeNo?: string | null;
  dtChequeDate?: string | null;
  strCardType?: string | null;
  strCardLastFourDigits?: string | null;
  strCardIssuerBank?: string | null;
  strCardTransactionId?: string | null;
  dblCardProcessingFee?: number | null;
  strReferenceNo?: string | null;
  strNarration?: string | null;
  strRejectionReason?: string | null;
}

export interface PaymentReceiptUpdate {
  strTransactionType: string;
  dtTransactionDate: string;
  strPaymentMode: string;
  strToAccountGUID: string;
  dblTotalAmount: number;
  strStatus?: string;
  strCurrencyTypeGUID?: string | null;
  dblExchangeRate?: number;
  dblBaseTotalAmount: number;
  dtExchangeRateDate?: string | null;
  strBankCashGUID?: string | null;
  strChequeNo?: string | null;
  dtChequeDate?: string | null;
  strCardType?: string | null;
  strCardLastFourDigits?: string | null;
  strCardIssuerBank?: string | null;
  strCardTransactionId?: string | null;
  dblCardProcessingFee?: number | null;
  strReferenceNo?: string | null;
  strNarration?: string | null;
  strRejectionReason?: string | null;
}

export interface PaymentReceiptListResponse {
  items: PaymentReceipt[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  statusCode?: number;
  succeeded?: boolean;
  message?: string;
  errors?: unknown[];
}

export interface PaymentReceiptParams {
  search?: string;
  dtTransactionDateFrom?: string;
  dtTransactionDateTo?: string;
  strTransactionType?: string;
  strPaymentMode?: string;
  strStatus?: string;
  strCreatedByGUID?: string;
  strUpdatedByGUID?: string;
  SearchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  ascending?: boolean;
  // Legacy params kept for backwards compatibility with any callers not yet updated
  fromDate?: string;
  toDate?: string;
  strToAccountGUID?: string;
  strCurrencyTypeGUID?: string;
  strCreatedByGUIDs?: string[];
}

export interface PaymentReceiptDropdownItem {
  strPaymentReceiptGUID: string;
  strTransactionNo: string;
}

export interface PaymentReceiptDropdownParams {
  search?: string;
}

export interface PaymentReceiptChangeStatusRequest {
  strPaymentReceiptGUIDs: string[];
  strStatus: string;
  strRejectedReason?: string | null;
}
