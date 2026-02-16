import type { BaseListParams, BackendPagedResponse } from "@/types";

export interface BoardTeamMember {
  strTeamMemberGUID: string;
  strTeamGUID: string;
  strUserGUID: string;
  strTeamName?: string | null;
  strUserName?: string | null;
  strUserEmail?: string | null;
  strProfileImg?: string | null;
  bolIsActive: boolean;
  strCreatedByGUID?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  dtUpdatedOn?: string | null;
}

export interface BoardTeamMemberParams extends BaseListParams {
  strTeamGUID?: string | null;
  strUserGUID?: string | null;
}

export interface CreateBoardTeamMember {
  strTeamGUID: string;
  strUserGUID: string;
}

export interface BulkCreateBoardTeamMember {
  strTeamGUID: string;
  strUserGUIDs: string[];
}

export interface BulkDeleteBoardTeamMember {
  strTeamGUID: string;
  strUserGUIDs: string[];
}

export interface BulkDeleteBoardTeamMemberResult {
  RequestedCount: number;
  DeletedCount: number;
  NotFoundTeamMemberGUIDs: string[];
}

export interface UpdateBoardTeamMember {
  strTeamGUID: string;
  strUserGUID: string;
}

export type BoardTeamMemberListResponse = BackendPagedResponse<BoardTeamMember[]>;
