import type { BackendPagedResponse, BaseListParams } from "@/types";

export interface InvoiceAddress {
  strAttention?: string | null;
  strCountryGUID?: string | null;
  strCountryName?: string | null;
  strAddress?: string | null;
  strStateGUID?: string | null;
  strStateName?: string | null;
  strCityGUID?: string | null;
  strCityName?: string | null;
  strPinCode?: string | null;
  strPhone?: string | null;
  strFaxNumber?: string | null;
}

export interface InvoiceItemBase {
  intSeqNo: number;
  strCategoryGUID?: string | null;
  strTaxCategoryName?: string | null;
  strItemGUID: string;
  strUoMGUID?: string | null;
  strDesc?: string | null;
  dblQty?: number | null;
  dblRate?: number | null;
  dblTaxPercentage?: number | null;
  dblTaxAmt?: number | null;
  dblNetAmt?: number | null;
  dblTotalAmt?: number | null;
  strAccountGUID?: string | null;
  dblDiscountPercentage?: number | null;
  dblDiscountAmt?: number | null;
  dblRateBase?: number | null;
  dblTaxAmtBase?: number | null;
  dblNetAmtBase?: number | null;
  dblTotalAmtBase?: number | null;
  dblDiscountAmtBase?: number | null;
}

export interface InvoiceItemUpsert extends InvoiceItemBase {
  strInvoice_ItemGUID?: string | null;
}

export interface InvoiceItem extends InvoiceItemUpsert {
  strInvoiceGUID: string;
  strItemName?: string | null;
  strUoMName?: string | null;
  strAccountName?: string | null;
  strItemImagePath?: string | null;
}

export interface InvoiceBase {
  dInvoiceDate: string;
  strOrderNo?: string | null;
  strPartyGUID: string;
  strCurrencyTypeGUID?: string | null;
  intPaymentTermsDays?: number | null;
  strBillingAddress?: InvoiceAddress | null;
  strShippingAddress?: InvoiceAddress | null;
  dtDueDate?: string | null;
  strStatus?: string | null;
  strSubject?: string | null;
  bolIsPaid: boolean;
  dblGrossTotalAmt?: number | null;
  dblTotalDiscountAmt?: number | null;
  dblTaxAmt?: number | null;
  strAdjustmentName?: string | null;
  strAdjustment_AccountGUID?: string | null;
  dblAdjustmentAmt?: number | null;
  dblNetAmt?: number | null;
  dblGrossTotalAmtBase?: number | null;
  dblTotalDiscountAmtBase?: number | null;
  dblTaxAmtBase?: number | null;
  dblAdjustmentAmtBase?: number | null;
  dblNetAmtBase?: number | null;
  dblPendingAmount?: number | null;
  dblPendingAmountBase?: number | null;
  strTC?: string | null;
  strCustomerNotes?: string | null;
  dblExchangeRate?: number | null;
  dtExchangeRateDate?: string | null;
}

export interface InvoiceResponse extends InvoiceBase {
  strInvoiceGUID: string;
  strInvoiceNo: string;
  intInvoiceSeqNo: number;
  strPartyName?: string | null;
  strCurrencyTypeName?: string | null;
  strGroupGUID: string;
  strOrganizationGUID: string;
  strYearGUID: string;
  strYearName?: string | null;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  dtUpdatedOn?: string | null;
  strApprovedByGUID?: string | null;
  strApprovedByName?: string | null;
  dtApprovedOn?: string | null;
  strRejectedByGUID?: string | null;
  strRejectedByName?: string | null;
  dtRejectedOn?: string | null;
  strRejectedReason?: string | null;
  items?: TranInvoiceItemResponse[] | null;
  strFiles?: InvoiceFileDto[] | null;
}

export interface Invoice extends InvoiceBase {
  strInvoiceGUID: string;
  strInvoiceNo: string;
  intInvoiceSeqNo: number;
  strPartyName?: string | null;
  strCurrencyTypeName?: string | null;
  strGroupGUID: string;
  strOrganizationGUID: string;
  strYearGUID: string;
  strYearName?: string | null;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  dtUpdatedOn?: string | null;
  strApprovedByGUID?: string | null;
  strApprovedByName?: string | null;
  dtApprovedOn?: string | null;
  strRejectedByGUID?: string | null;
  strRejectedByName?: string | null;
  dtRejectedOn?: string | null;
  strRejectedReason?: string | null;
  items?: InvoiceItem[] | null;
  strFiles?: InvoiceFileDto[] | null;
}

export type InvoiceListItem = Omit<Invoice, "items">;

export interface TranInvoiceItemResponse {
  strInvoice_ItemGUID: string;
  strInvoiceGUID: string;
  intSeqNo: number;
  strCategoryGUID?: string | null;
  strTaxCategoryName?: string | null;
  strItemGUID?: string | null;
  strItemName?: string | null;
  strUoMGUID?: string | null;
  strUoMName?: string | null;
  strDesc?: string | null;
  dblQty?: number | null;
  dblRate?: number | null;
  dblTaxPercentage?: number | null;
  dblTaxAmt?: number | null;
  dblNetAmt?: number | null;
  dblTotalAmt?: number | null;
  strAccountGUID?: string | null;
  strAccountName?: string | null;
  dblDiscountPercentage?: number | null;
  dblDiscountAmt?: number | null;
  dblRateBase?: number | null;
  dblTaxAmtBase?: number | null;
  dblNetAmtBase?: number | null;
  dblTotalAmtBase?: number | null;
  dblDiscountAmtBase?: number | null;
}

export interface InvoiceFileDto {
  strDocumentGUID: string;
  strDocumentAssociationGUID?: string | null;
  strFileName?: string | null;
  strFileType?: string | null;
  strFilePath?: string | null;
  strFileSize?: string | null;
}

export interface InvoiceParams extends BaseListParams {
  fromDate?: string;
  toDate?: string;
  strPartyGUIDs?: string;
  strCurrencyTypeGUIDs?: string;
  bolIsPaid?: boolean;
  strStatus?: string;
  strCreatedByGUIDs?: string;
  strUpdatedByGUIDs?: string;
}

export interface PendingApprovalParams extends BaseListParams {
  fromDate?: string;
  toDate?: string;
  strCurrencyTypeGUIDs?: string;
}

export interface InvoiceCreate extends InvoiceBase {
  items: InvoiceItemBase[];
}

export interface InvoiceUpdate extends InvoiceBase {
  items?: InvoiceItemUpsert[] | null;
  strRemoveInvoiceItemGUIDs?: string[] | null;
}

// Backend returns paged meta at the root and array in `data`
export type InvoiceListResponse = BackendPagedResponse<InvoiceListItem[]>;

export interface PendingInvoiceByCustomer {
  strInvoiceGUID: string;
  dInvoiceDate: string;
  strInvoiceNo: string;
  strPartyGUID: string;
  dblNetAmt?: number | null;
  dblProcessedAmount?: number | null;
  dblUnProcessedAmount?: number | null;
  dblPendingAmount?: number | null;
}

// Response is now a simple list (no pagination)
export type PendingInvoiceByCustomerResponse = PendingInvoiceByCustomer[];

export interface InvoiceDropdownItem {
  strInvoiceGUID: string;
  strInvoiceNo: string;
  intTotalDocuments: number;
}

export interface InvoiceDropdownParams {
  search?: string;
}

export interface CustomerPendingInvoiceParams {
  strCustomerGUID: string;
}

export interface ChangeStatusRequest {
  strInvoiceGUIDs: string[];
  strStatus: string;
  strRejectedReason?: string | null;
}

// Print-related types
export interface PartyPrintDto {
  strPartyGUID: string;
  strPartyName?: string | null;
  strCompanyName?: string | null;
  strEmail?: string | null;
  strPhoneNoWork?: string | null;
  strPhoneNoPersonal?: string | null;
  strPAN?: string | null;
  strTaxRegNo?: string | null;
  strUDFCode?: string | null;
}

export interface AddressPrintDto {
  strAttention?: string | null;
  strAddress?: string | null;
  strCityName?: string | null;
  strStateName?: string | null;
  strCountryName?: string | null;
  strPinCode?: string | null;
  strPhone?: string | null;
  strFaxNumber?: string | null;
  strFormattedAddress?: string | null;
}

export interface ItemTaxDetailPrintDto {
  strTaxRateName?: string | null;
  dblTaxPercentage: number;
  dblTaxableAmount: number;
  dblTaxAmount: number;
}

export interface InvoiceItemPrintDto {
  strInvoice_ItemGUID: string;
  intSeqNo: number;
  strItemGUID?: string | null;
  strItemName?: string | null;
  strDesc?: string | null;
  strHSNCode?: string | null;
  strUoMGUID?: string | null;
  strUoMName?: string | null;
  dblQty?: number | null;
  dblRate?: number | null;
  dblAmount?: number | null;
  dblDiscountPercentage?: number | null;
  dblDiscountAmt?: number | null;
  dblTaxPercentage?: number | null;
  dblTaxAmt?: number | null;
  dblNetAmt?: number | null;
  dblTotalAmt?: number | null;
  TaxDetails?: ItemTaxDetailPrintDto[] | null;
  dblRateBase?: number | null;
  dblDiscountAmtBase?: number | null;
  dblTaxAmtBase?: number | null;
  dblNetAmtBase?: number | null;
  dblTotalAmtBase?: number | null;
}

export interface TaxSummaryPrintDto {
  strTaxName: string;
  dblTaxPercentage: number;
  dblTaxableAmount: number;
  dblTaxAmount: number;
}

export interface TaxConfigPrintDto {
  strTaxTypeCode?: string | null;
  strTaxTypeName?: string | null;
  strTaxRegNo?: string | null;
  strStateName?: string | null;
}

export interface InvoicePrintResponse {
  strInvoiceGUID: string;
  strInvoiceNo: string;
  dInvoiceDate: string;
  strFormattedInvoiceDate?: string | null;
  dtDueDate?: string | null;
  strFormattedDueDate?: string | null;
  strOrderNo?: string | null;
  strStatus?: string | null;
  strSubject?: string | null;
  intPaymentTermsDays?: number | null;
  bolIsPaid: boolean;
  Party?: PartyPrintDto | null;
  BillingAddress?: AddressPrintDto | null;
  ShippingAddress?: AddressPrintDto | null;
  strCurrencyTypeGUID?: string | null;
  strCurrencyName?: string | null;
  dblExchangeRate?: number | null;
  dtExchangeRateDate?: string | null;
  Items?: InvoiceItemPrintDto[] | null;
  TaxSummary?: TaxSummaryPrintDto[] | null;
  dblGrossTotalAmt?: number | null;
  dblTotalDiscountAmt?: number | null;
  dblTaxAmt?: number | null;
  strAdjustmentName?: string | null;
  dblAdjustmentAmt?: number | null;
  dblNetAmt?: number | null;
  strNetAmtInWords?: string | null;
  dblGrossTotalAmtBase?: number | null;
  dblTotalDiscountAmtBase?: number | null;
  dblTaxAmtBase?: number | null;
  dblAdjustmentAmtBase?: number | null;
  dblNetAmtBase?: number | null;
  dblPendingAmount?: number | null;
  dblPendingAmountBase?: number | null;
  strTC?: string | null;
  strCustomerNotes?: string | null;
  TaxConfig?: TaxConfigPrintDto | null;
  dtCreatedOn: string;
  strCreatedByName?: string | null;
  dtApprovedOn?: string | null;
  strApprovedByName?: string | null;
  strYearGUID: string;
  strYearName?: string | null;
  strOrganizationGUID?: string | null;
  strLogo?: string | null;
  strOrganizationName?: string | null;
  strDescription?: string | null;
}
