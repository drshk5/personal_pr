import type { BaseListParams, BackendPagedResponse } from "@/types";

export interface BoardTeam {
  strBoardTeamGUID: string;
  strBoardGUID: string;
  strBoardName?: string | null;
  strBoardDescription?: string | null;
  strUserGUID: string;
  strUserName?: string | null;
  strUserEmail?: string | null;
  strUserProfileImg?: string | null;
  bolUserIsActive: boolean;
  strReportingToGUID?: string | null;
  strReportingToUserName?: string | null;
  strReportingToUserEmail?: string | null;
  strCreatedByGUID?: string | null;
  strCreatedBy?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedBy?: string | null;
  dtUpdatedOn?: string | null;
  dtJoinedOn: string;
}

export interface BoardTeamParams extends BaseListParams {
  strReportingToGUID?: string | null;
}

export interface CreateBoardTeam {
  strUserGUIDs: string[];
  strReportingToGUID?: string | null;
}

export interface BulkDeleteBoardTeam {
  strUserGUIDs: string[];
}

export interface BulkDeleteBoardTeamResult {
  RequestedCount: number;
  RemovedCount: number;
  NotFoundUserGUIDs: string[];
}

export type BoardTeamListResponse = BackendPagedResponse<BoardTeam[]>;

export interface AvailableUser {
  strUserGUID: string;
  strName?: string;
  strUserName?: string;
  strEmailId: string;
  strMobileNo?: string;
  bolIsActive?: boolean;
  strProfileImg?: string | null;
}

export type AvailableUsersListResponse = BackendPagedResponse<AvailableUser[]>;

export interface BoardInfo {
  strBoardGUID: string;
  strBoardName?: string | null;
  strBoardTeamGUID: string;
}

export interface UserBoards {
  strUserGUID: string;
  strUserName?: string | null;
  strUserEmail?: string | null;
  totalBoards: number;
  boards: BoardInfo[];
}

export interface Subordinate {
  strUserGUID: string;
  strUserName?: string | null;
  strUserEmail?: string | null;
  strProfileImg?: string | null;
  bolIsActive: boolean;
  level: number;
}

export interface UserHierarchy {
  strUserGUID: string;
  strUserName?: string | null;
  strUserEmail?: string | null;
  totalSubordinates: number;
  subordinates: Subordinate[];
}

export interface BoardUser {
  strUserGUID: string;
  strUserName?: string | null;
  strUserEmail?: string | null;
  strProfileImg?: string | null;
  bolIsActive: boolean;
  strBoardTeamGUID: string;
  strReportingToGUID?: string | null;
  strReportingToUserName?: string | null;
  dtJoinedOn: string;
}

export interface BoardUsersResponse {
  strBoardGUID: string;
  strBoardName: string;
  totalUsers: number;
  users: BoardUser[];
}
