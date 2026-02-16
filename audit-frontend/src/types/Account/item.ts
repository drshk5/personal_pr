import type { BaseListParams, BackendPagedResponse } from "@/types";

export interface ItemFile {
  strDocumentGUID: string;
  strDocumentAssociationGUID?: string | null;
  strFileName?: string | null;
  strFileType?: string | null;
  strFilePath?: string | null;
  strFileSize?: string | null;
}

export interface ItemSalesData {
  strItemGUID: string;
  strName: string;
  strUnitGUID: string;
  strUnitName: string;
  dblSellingPrice?: number | null;
  strSalesAccountGUID?: string | null;
  strSalesDescription?: string | null;
  strTaxCategoryGUID?: string | null;
  strTaxCategoryName?: string | null;
  decTaxPercentage: number;
}

export interface ItemPurchaseData {
  strItemGUID: string;
  strName: string;
  strUnitGUID: string;
  strUnitName: string;
  dblCostPrice?: number | null;
  strPurchaseAccountGUID?: string | null;
  strPurchaseDescription?: string | null;
  strPreferredVendorGUID?: string | null;
  strTaxCategoryGUID?: string | null;
  strTaxCategoryName?: string | null;
  decTaxPercentage: number;
}

// Full item shape returned by most item endpoints
export interface Item {
  strItemGUID: string;
  strType: string;
  strName: string;
  strUnitGUID: string;
  strUnitName?: string | null;
  bolIsSellable: boolean;
  dblSellingPrice?: number | null;
  strSalesAccountGUID?: string | null;
  strSalesDescription?: string | null;
  bolIsPurchasable: boolean;
  dblCostPrice?: number | null;
  strPurchaseAccountGUID?: string | null;
  strPurchaseDescription?: string | null;
  strPreferredVendorGUID?: string | null;
  strTaxCategoryGUID?: string | null;
  strTaxCategoryName?: string | null;
  strHSNCode?: string | null;
  strGroupGUID: string;
  strOrganizationGUID: string;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  dtUpdatedOn?: string | null;
  strFiles?: ItemFile[] | null;
}

// Simplified shape returned by create/update endpoints (matches MstItemSimpleResponseDto)
export interface ItemSimple {
  strItemGUID: string;
  strType: string;
  strName: string;
  strUnitGUID: string;
  bolIsSellable: boolean;
  dblSellingPrice?: number | null;
  strSalesAccountGUID?: string | null;
  strSalesDescription?: string | null;
  bolIsPurchasable: boolean;
  dblCostPrice?: number | null;
  strPurchaseAccountGUID?: string | null;
  strPurchaseDescription?: string | null;
  strPreferredVendorGUID?: string | null;
  strTaxCategoryGUID?: string | null;
  strHSNCode?: string | null;
  strGroupGUID: string;
  strOrganizationGUID: string;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  dtUpdatedOn?: string | null;
}

// Active by type endpoint shape (Purchasable/Sellable)
// Returns unified item data for both sales and purchase flows
// Price is single field: selling price if Sellable, cost price if Purchasable
export interface ItemActiveByType {
  strItemGUID: string;
  strName: string;
  dblPrice?: number | null;

  // Unit details
  strUnitGUID: string;
  strUnitName: string;

  // Sales-specific fields (populated when type = Sellable)
  strSalesAccountGUID?: string | null;
  strSalesDescription?: string | null;

  // Purchase-specific fields (populated when type = Purchasable)
  strPurchaseAccountGUID?: string | null;
  strPurchaseDescription?: string | null;
  strPreferredVendorGUID?: string | null;

  // Tax details
  strTaxCategoryGUID?: string | null;
  strTaxCategoryName?: string | null;
  decTaxPercentage: number;

  // Image path or URL
  strImagePath?: string | null;
}

export interface ItemParams extends BaseListParams {
  strType?: string;
  strUnitGUID?: string;
  bolIsSellable?: boolean;
  bolIsPurchasable?: boolean;
  strTaxCategoryGUID?: string;
  strHSNCode?: string;
  strCreatedByGUIDs?: string | string[];
  strUpdatedByGUIDs?: string | string[];
}

export interface ItemCreate {
  strType: string;
  strName: string;
  strUnitGUID: string;
  bolIsSellable: boolean;
  dblSellingPrice?: number | null;
  strSalesAccountGUID?: string | null;
  strSalesDescription?: string | null;
  bolIsPurchasable: boolean;
  dblCostPrice?: number | null;
  strPurchaseAccountGUID?: string | null;
  strPurchaseDescription?: string | null;
  strPreferredVendorGUID?: string | null;
  strTaxCategoryGUID?: string | null;
  strHSNCode?: string | null;
}

export interface ItemUpdate {
  strType: string;
  strName: string;
  strUnitGUID: string;
  bolIsSellable: boolean;
  dblSellingPrice?: number | null;
  strSalesAccountGUID?: string | null;
  strSalesDescription?: string | null;
  bolIsPurchasable: boolean;
  dblCostPrice?: number | null;
  strPurchaseAccountGUID?: string | null;
  strPurchaseDescription?: string | null;
  strPreferredVendorGUID?: string | null;
  strTaxCategoryGUID?: string | null;
  strHSNCode?: string | null;
}

export type ItemListResponse = BackendPagedResponse<Item[]>;
