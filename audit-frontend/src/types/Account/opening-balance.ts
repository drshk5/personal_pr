import type { BaseListParams, BackendPagedResponse } from "@/types";

// Base interface for common properties
export interface OpeningBalanceBase {
  dtOpeningBalanceDate: string;
  strAccountGUID: string;
  strCurrencyTypeGUID?: string | null;
  dblDebit?: number | null;
  dblCredit?: number | null;
  dblExchangeRate?: number | null;
  dtExchangeDate?: string | null;
  dblDebit_BaseCurrency?: number | null;
  dblCredit_BaseCurrency?: number | null;
}

export interface OpeningBalance extends OpeningBalanceBase {
  strOpeningBalanceGUID: string;
  strAccountName?: string | null;
  strOpeningBalanceNo: string;
  intOpengBalanceSeqNo: number;
  strCurrencyTypeName?: string | null;
  strGroupGUID: string;
  strOrganizationGUID: string;
  strYearGUID: string;
  strYearName?: string | null;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  dtUpdatedOn?: string | null;
  strCreatedByName?: string | null;
  strUpdatedByName?: string | null;
}

export interface OpeningBalanceListItem extends OpeningBalanceBase {
  strOpeningBalanceGUID: string;
  strAccountName?: string | null;
  strOpeningBalanceNo: string;
  intOpengBalanceSeqNo: number;
  strCurrencyTypeName?: string | null;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  dtUpdatedOn?: string | null;
  strCreatedByName?: string | null;
  strUpdatedByName?: string | null;
}

export interface OpeningBalanceCreate extends OpeningBalanceBase {
  strAccountName?: string | null;
}

export interface OpeningBalanceUpdate extends OpeningBalanceBase {
  strAccountName?: string | null;
}

// Filter parameters
export interface OpeningBalanceParams extends BaseListParams {
  fromDate?: string;
  toDate?: string;
  strAccountGUIDs?: string; // Comma-separated list of account GUIDs
  strCurrencyTypeGUIDs?: string; // Comma-separated list of currency type GUIDs
  strCreatedByGUIDs?: string; // Comma-separated list of created by user GUIDs
  strUpdatedByGUIDs?: string; // Comma-separated list of updated by user GUIDs
}

// Import types
export interface OpeningBalanceColumnMapping {
  accountName?: string;
  accountType?: string;
  accountCode?: string;
  openingBalanceDate?: string;
  debit?: string;
  credit?: string;
}

export interface OpeningBalanceImportRequest {
  file: File;
  columnMapping?: OpeningBalanceColumnMapping;
}

export interface OpeningBalanceImportError {
  row: number;
  accountName?: string;
  errors: string[];
}

export interface OpeningBalanceImportResult {
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  errors: OpeningBalanceImportError[];
  summary: string;
}

// Response types
export type OpeningBalanceListResponse = BackendPagedResponse<
  OpeningBalanceListItem[]
>;

export type OpeningBalanceResponse = OpeningBalance;
