import type { BaseListParams, BackendPagedResponse } from "@/types";

export interface BoardTeamGroup {
  strTeamGUID: string;
  strBoardGUID: string;
  strParentTeamGUID?: string | null;
  strParentTeamName?: string | null;
  strTeamName: string;
  strDescription?: string | null;
  bolIsActive: boolean;
  Members: BoardTeamGroupMember[];
  strCreatedByGUID?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  dtUpdatedOn?: string | null;
}

export interface BoardTeamGroupMember {
  strUserGUID: string;
  strUserName?: string | null;
  strProfileImg?: string | null;
}

export interface BoardTeamGroupSimple {
  strTeamGUID: string;
  strBoardGUID: string;
  strParentTeamGUID?: string | null;
  strTeamName: string;
  strDescription?: string | null;
  bolIsActive: boolean;
  dtCreatedOn: string;
  dtUpdatedOn: string;
}

export interface BoardTeamGroupActive {
  strTeamGUID: string;
  strTeamName: string;
  strParentTeamGUID?: string | null;
  children: BoardTeamGroupActive[];
}

export interface BoardTeamGroupParams extends BaseListParams {
  strBoardGUID?: string;
}

export interface CreateBoardTeamGroup {
  strBoardGUID: string;
  strParentTeamGUID?: string | null;
  strTeamName: string;
  strDescription?: string | null;
}

export interface UpdateBoardTeamGroup {
  strBoardGUID: string;
  strParentTeamGUID?: string | null;
  strTeamName: string;
  strDescription?: string | null;
  bolIsActive: boolean;
}

export type BoardTeamGroupListResponse = BackendPagedResponse<BoardTeamGroup[]>;

export interface AvailableUserForTeamGroup {
  strUserGUID: string;
  strName: string;
  strEmailId: string;
  strMobileNo?: string;
  strProfileImg?: string | null;
}

export type AvailableUsersForTeamGroupResponse = BackendPagedResponse<
  AvailableUserForTeamGroup[]
>;
