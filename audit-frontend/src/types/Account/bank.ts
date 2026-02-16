import type { BaseListParams, BackendPagedResponse } from "@/types";

export interface Bank {
  strBankGUID: string;
  strGroupGUID: string;
  strAccountName: string;
  strUDFCode: string;
  strAccountTypeGUID: string;
  strAccountTypeName?: string | null;
  strCurrencyTypeGUID: string;
  strCurrencyTypeName?: string | null;
  strAccountNumber?: string | null;
  strBankName?: string | null;
  strIFSCCode?: string | null;
  strDesc?: string | null;
  strBranchName?: string | null;
  bolIsPrimary: boolean;
  strOrganizationGUID: string;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  dtUpdatedOn: string;
}

export type BankSimple = Omit<
  Bank,
  | "strAccountTypeName"
  | "strCurrencyTypeName"
  | "strCreatedByName"
  | "strUpdatedByName"
>;

export interface BankParams extends BaseListParams {
  strAccountTypeGUIDs?: string | string[];
  strCurrencyTypeGUIDs?: string | string[];
  strCreatedByGUIDs?: string | string[];
  strUpdatedByGUIDs?: string | string[];
  bolIsPrimary?: boolean;
}

export interface BankCreate {
  strAccountName: string;
  strUDFCode: string;
  strAccountTypeGUID: string;
  strCurrencyTypeGUID: string;
  strAccountNumber?: string | null;
  strBankName?: string | null;
  strIFSCCode?: string | null;
  strDesc?: string | null;
  strBranchName?: string | null;
  bolIsPrimary?: boolean;
}

export type BankUpdate = BankCreate;

export type BankListResponse = BackendPagedResponse<Bank[]>;
