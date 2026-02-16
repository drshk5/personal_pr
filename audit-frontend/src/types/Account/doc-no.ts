import type { BaseListParams, BackendPagedResponse } from "@/types";

export interface DocNo {
  strDocumentNoGUID: string;
  strDocumentTypeGUID: string;
  strDocumentTypeName?: string | null;
  strGroupGUID: string;
  strOrganizationGUID: string;
  strYearGUID: string;
  strYearName?: string | null;
  intDigit: number;
  strPrefix?: string | null;
  strSufix?: string | null;
  intStartNo: number;
  intLastCreatedNo: number;
  bolIsDefault: boolean;
  strCreatedByGUID?: string | null;
  dtCreatedOn?: string;
  strUpdatedByGUID?: string | null;
  dtUpdatedOn: string;
  strCreatedByName?: string | null;
  strUpdatedByName?: string | null;
}

export type DocNoSimple = Omit<
  DocNo,
  | "strDocumentTypeName"
  | "strYearName"
  | "strCreatedByName"
  | "strUpdatedByName"
>;

export interface DocNoParams extends BaseListParams {
  strDocumentTypeGUIDs?: string;
  strYearGUID?: string;
  bolIsDefault?: boolean;
}

export interface DocNoCreate {
  strDocumentTypeGUID: string;
  intDigit: number;
  strPrefix?: string | null;
  strSufix?: string | null;
  intStartNo: number;
}

export interface DocNoUpdate {
  strDocumentTypeGUID: string;
  strYearGUID: string;
  intDigit: number;
  strPrefix?: string | null;
  strSufix?: string | null;
  intStartNo: number;
  intLastCreatedNo: number;
}

export interface DocNoCopyFromRequest {
  strYearGUID: string;
}

export interface DocNoGenerateRequest {
  strDocTypeName: string;
  strYearGUID?: string | null;
}

export interface DocNoGenerateResponse {
  DocumentNumber: string;
  FormattedDocumentNumber: string;
  LastUsedNumber: number;
  DocTypeGUID: string;
  DocTypeName: string;
  YearGUID: string;
  YearName?: string | null;
  Prefix?: string | null;
  Suffix?: string | null;
  Digits: number;
}

export type DocNoListResponse = BackendPagedResponse<DocNo[]>;
