import type { ApiPagedResponse, BaseListParams } from "@/types";

export interface RenameSchedule {
  strRenameScheduleGUID: string;
  strRenameScheduleName: string;
  strScheduleGUID: string;
  strScheduleName: string;
  strScheduleCode: string;
  strRefNo?: string | null;
  strParentScheduleGUID?: string | null;
  bolIsEditable: boolean;
  dteCreatedOn?: string | null;
  strCreatedByGUID?: string | null;
  strCreatedByName?: string | null;
  dteModifiedOn?: string | null;
  strModifiedByGUID?: string | null;
  strModifiedByName?: string | null;
  children: RenameSchedule[];
}

export type RenameScheduleResponse = RenameSchedule;

export interface RenameScheduleParams extends BaseListParams {
  strScheduleGUIDs?: string | string[];
  strParentScheduleGUIDs?: string | string[];
  strCreatedByGUIDs?: string | string[];
  strModifiedByGUIDs?: string | string[];
}

export interface RenameScheduleUpsert {
  strRenameScheduleGUID: string;
  strRenameScheduleName: string;
  strScheduleGUID: string;
}

export interface RenameScheduleUpdate {
  strRenameScheduleName: string;
  strScheduleGUID: string;
}

export type RenameScheduleListResponse = ApiPagedResponse<RenameSchedule>;
