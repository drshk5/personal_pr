import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  BoardTeamParams,
  CreateBoardTeam,
  BoardTeamListResponse,
  BulkDeleteBoardTeamResult,
  AvailableUsersListResponse,
  UserBoards,
  UserHierarchy,
  BoardUsersResponse,
} from "@/types/task/board-team";
import type { BaseListParams } from "@/types";

export const boardTeamService = {
  addUsersToBoard: async (
    boardGuid: string,
    data: CreateBoardTeam
  ): Promise<BoardTeamListResponse> => {
    return await ApiService.postWithMeta<BoardTeamListResponse>(
      `${TASK_API_PREFIX}/BoardTeam/${boardGuid}`,
      data
    );
  },

  removeUserFromBoard: async (
    boardGuid: string,
    userGuid: string
  ): Promise<boolean> => {
    return await ApiService.delete<boolean>(
      `${TASK_API_PREFIX}/BoardTeam/${boardGuid}/user/${userGuid}`
    );
  },

  bulkRemoveUsersFromBoard: async (
    boardGuid: string,
    userGuids: string[]
  ): Promise<BulkDeleteBoardTeamResult> => {
    return await ApiService.deleteWithBody<BulkDeleteBoardTeamResult>(
      `${TASK_API_PREFIX}/BoardTeam/${boardGuid}/bulk-delete`,
      { strUserGUIDs: userGuids }
    );
  },

  getBoardTeamMembers: async (
    boardGuid: string,
    params: BoardTeamParams = {}
  ): Promise<BoardTeamListResponse> => {
    return await ApiService.getWithMeta<BoardTeamListResponse>(
      `${TASK_API_PREFIX}/BoardTeam/${boardGuid}`,
      params as Record<string, unknown>
    );
  },

  getAvailableUsersForBoard: async (
    boardGuid: string,
    params: BaseListParams = {}
  ): Promise<AvailableUsersListResponse> => {
    return await ApiService.getWithMeta<AvailableUsersListResponse>(
      `${TASK_API_PREFIX}/BoardTeam/${boardGuid}/available-users`,
      params as Record<string, unknown>
    );
  },

  getBoardsByUser: async (userGuid: string): Promise<UserBoards> => {
    return await ApiService.get<UserBoards>(
      `${TASK_API_PREFIX}/BoardTeam/user/${userGuid}/boards`
    );
  },

  getUserHierarchy: async (
    userGuid: string,
    strBoardGUID: string
  ): Promise<UserHierarchy> => {
    return await ApiService.get<UserHierarchy>(
      `${TASK_API_PREFIX}/BoardTeam/user/${userGuid}/hierarchy`,
      { strBoardGUID } as Record<string, unknown>
    );
  },

  getBoardUsers: async (strBoardGUID: string): Promise<BoardUsersResponse> => {
    return await ApiService.get<BoardUsersResponse>(
      `${TASK_API_PREFIX}/BoardTeam/board/users`,
      { strBoardGUID } as Record<string, unknown>
    );
  },
};
