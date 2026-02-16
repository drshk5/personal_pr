import type { BackendPagedResponse, BaseListParams } from "@/types";
import type {
  AddressPrintDto,
  InvoiceAddress,
  ItemTaxDetailPrintDto,
  PartyPrintDto,
  TaxConfigPrintDto,
  TaxSummaryPrintDto,
} from "@/types/Account/salesinvoice";

export interface PurchaseInvoiceItemBase {
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

export interface PurchaseInvoiceItemUpsert extends PurchaseInvoiceItemBase {
  strPurchaseInvoice_ItemGUID?: string | null;
}

export interface PurchaseInvoiceItem extends PurchaseInvoiceItemUpsert {
  strPurchaseInvoiceGUID: string;
  strItemName?: string | null;
  strUoMName?: string | null;
  strAccountName?: string | null;
  strTaxCategoryName?: string | null;
  strItemImagePath?: string | null;
}

export interface PurchaseInvoiceBase {
  dPurchaseInvoiceDate: string;
  strOrderNo?: string | null;
  strPartyGUID: string;
  strCurrencyTypeGUID?: string | null;
  strAdjustment_AccountGUID?: string | null;
  strBillingAddress?: InvoiceAddress | null;
  strShippingAddress?: InvoiceAddress | null;
  strStatus?: string | null;
  strSubject?: string | null;
  dblGrossTotalAmt?: number | null;
  dblTotalDiscountAmt?: number | null;
  dblTaxAmt?: number | null;
  strAdjustmentName?: string | null;
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

export interface PurchaseInvoiceFile {
  strDocumentGUID: string;
  strDocumentAssociationGUID?: string | null;
  strFileName?: string | null;
  strFileType?: string | null;
  strFilePath?: string | null;
  strFileSize?: string | null;
}

export interface PurchaseInvoice extends PurchaseInvoiceBase {
  strPurchaseInvoiceGUID: string;
  strPurchaseInvoiceNo: string;
  intPurchaseInvoiceSeqNo: number;
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
  items?: PurchaseInvoiceItem[] | null;
  strFiles?: PurchaseInvoiceFile[] | null;
}

// Returned by create and update endpoints
export interface PurchaseInvoiceSimpleResponse {
  strPurchaseInvoiceGUID: string;
  dPurchaseInvoiceDate: string;
  strPurchaseInvoiceNo: string;
  intPurchaseInvoiceSeqNo: number;
  strStatus?: string | null;
}

export type PurchaseInvoiceListItem = Omit<
  PurchaseInvoice,
  "items" | "strFiles"
>;

export interface PurchaseInvoiceDropdownItem {
  strPurchaseInvoiceGUID: string;
  strPurchaseInvoiceNo: string;
  intTotalDocuments: number;
}

export interface PurchaseInvoiceDropdownParams {
  search?: string;
}

export interface PurchaseInvoiceParams extends BaseListParams {
  fromDate?: string;
  toDate?: string;
  strPartyGUIDs?: string;
  strCurrencyTypeGUIDs?: string;
  strStatus?: string;
  strCreatedByGUIDs?: string;
  strUpdatedByGUIDs?: string;
}

export interface PurchaseInvoicePendingApprovalParams extends BaseListParams {
  fromDate?: string;
  toDate?: string;
  strCurrencyTypeGUIDs?: string;
}

export interface PurchaseInvoiceCreate extends PurchaseInvoiceBase {
  items: PurchaseInvoiceItemBase[];
}

export interface PurchaseInvoiceUpdate extends PurchaseInvoiceBase {
  items?: PurchaseInvoiceItemUpsert[] | null;
  strRemovePurchaseInvoiceItemGUIDs?: string[] | null;
}

// Backend returns paged meta at the root and array in `data`
export type PurchaseInvoiceListResponse = BackendPagedResponse<
  PurchaseInvoiceListItem[]
>;

export interface PurchaseInvoiceChangeStatusRequest {
  strPurchaseInvoiceGUIDs: string[];
  strStatus: string;
  strRejectedReason?: string | null;
}
export interface PurchaseInvoicePendingPayment {
  strPurchaseInvoiceGUID: string;
  dPurchaseInvoiceDate: string;
  strPurchaseInvoiceNo: string;
  strPartyGUID: string;
  dblNetAmt?: number | null;
  dblProcessedAmount?: number | null;
  dblPendingAmount?: number | null;
  dblUnProcessedAmount?: number | null;
}

// Response is now a simple list (no pagination)
export type PurchaseInvoicePendingPaymentResponse =
  PurchaseInvoicePendingPayment[];

// Request now only accepts strVendorGUID - all other filters are handled internally by backend
export interface VendorPendingPurchaseInvoiceParams {
  strVendorGUID: string;
}

// Print-related types
export type PurchaseInvoicePartyPrintDto = PartyPrintDto;
export type PurchaseInvoiceAddressPrintDto = AddressPrintDto;
export type PurchaseInvoiceItemTaxDetailPrintDto = ItemTaxDetailPrintDto;
export type PurchaseInvoiceTaxSummaryPrintDto = TaxSummaryPrintDto;
export type PurchaseInvoiceTaxConfigPrintDto = TaxConfigPrintDto;

export interface PurchaseInvoiceItemPrintDto {
  strPurchaseInvoice_ItemGUID: string;
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
  TaxDetails?: PurchaseInvoiceItemTaxDetailPrintDto[] | null;
  dblRateBase?: number | null;
  dblDiscountAmtBase?: number | null;
  dblTaxAmtBase?: number | null;
  dblNetAmtBase?: number | null;
  dblTotalAmtBase?: number | null;
}

export interface PurchaseInvoicePrintResponse {
  strPurchaseInvoiceGUID: string;
  strPurchaseInvoiceNo: string;
  dPurchaseInvoiceDate: string;
  strFormattedPurchaseInvoiceDate?: string | null;
  dtDueDate?: string | null;
  strFormattedDueDate?: string | null;
  strOrderNo?: string | null;
  strStatus?: string | null;
  strSubject?: string | null;
  intPaymentTermsDays?: number | null;
  bolIsPaid: boolean;
  Party?: PurchaseInvoicePartyPrintDto | null;
  BillingAddress?: PurchaseInvoiceAddressPrintDto | null;
  ShippingAddress?: PurchaseInvoiceAddressPrintDto | null;
  strCurrencyTypeGUID?: string | null;
  strCurrencyName?: string | null;
  dblExchangeRate?: number | null;
  dtExchangeRateDate?: string | null;
  Items?: PurchaseInvoiceItemPrintDto[] | null;
  TaxSummary?: PurchaseInvoiceTaxSummaryPrintDto[] | null;
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
  strVendorNotes?: string | null;
  strCustomerNotes?: string | null;
  TaxConfig?: PurchaseInvoiceTaxConfigPrintDto | null;
  strYearGUID: string;
  strYearName?: string | null;
  strOrganizationGUID?: string | null;
  strLogo?: string | null;
  strOrganizationName?: string | null;
  strDescription?: string | null;
}
