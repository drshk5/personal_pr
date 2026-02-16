import type { BaseListParams, BackendPagedResponse } from "@/types";

// Matches MstGeneralAccountResponseDto from backend
export interface GeneralAccount {
  strGeneralAccountGUID: string;
  strGroupGUID: string;
  strGeneralAccountName: string;
  strAccountTypeGUID: string;
  strAccountTypeName?: string | null;
  strScheduleGUID: string;
  strScheduleName?: string | null;
  strUDFCode: string;
  strDesc?: string | null;
  bolIsActive: boolean;
  bolIsLock: boolean;
  strOrganizationGUID: string;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  dtUpdatedOn: string;
}

export interface GeneralAccountSimple {
  strGeneralAccountGUID: string;
  strGeneralAccountName: string;
}

// Matches MstGeneralAccountFilterDto from backend
export interface GeneralAccountParams extends BaseListParams {
  bolIsActive?: boolean;
  strAccountTypeGUIDs?: string | string[];
  strScheduleGUIDs?: string | string[];
  strCreatedByGUIDs?: string | string[];
  strUpdatedByGUIDs?: string | string[];
}

// Matches MstGeneralAccountCreateDto from backend
export interface GeneralAccountCreate {
  strGeneralAccountName: string;
  strAccountTypeGUID: string;
  strScheduleGUID: string;
  strUDFCode: string;
  strDesc?: string | null;
  bolIsActive: boolean;
}

// Matches MstGeneralAccountUpdateDto from backend
export interface GeneralAccountUpdate {
  strGeneralAccountName: string;
  strAccountTypeGUID: string;
  strScheduleGUID: string;
  strUDFCode: string;
  strDesc?: string | null;
  bolIsActive: boolean;
}

export type GeneralAccountListResponse = BackendPagedResponse<GeneralAccount[]>;
