import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  BoardTeamGroup,
  BoardTeamGroupActive,
  BoardTeamGroupSimple,
  BoardTeamGroupListResponse,
  BoardTeamGroupParams,
  CreateBoardTeamGroup,
  UpdateBoardTeamGroup,
  AvailableUsersForTeamGroupResponse,
} from "@/types/task/board-team-group";
import type { BaseListParams } from "@/types";

export const boardTeamGroupService = {
  /**
   * Get all teams/sub-teams for a specific board with pagination
   */
  getAll: async (
    strBoardGUID: string,
    params: BoardTeamGroupParams = {}
  ): Promise<BoardTeamGroupListResponse> => {
    return await ApiService.getWithMeta<BoardTeamGroupListResponse>(
      `${TASK_API_PREFIX}/BoardTeamGroup`,
      { strBoardGUID, ...params } as Record<string, unknown>
    );
  },

  getById: async (id: string): Promise<BoardTeamGroup> => {
    return await ApiService.get<BoardTeamGroup>(
      `${TASK_API_PREFIX}/BoardTeamGroup/${id}`
    );
  },

  getActiveTeams: async (strBoardGUID: string): Promise<BoardTeamGroupActive[]> => {
    return await ApiService.get<BoardTeamGroupActive[]>(
      `${TASK_API_PREFIX}/BoardTeamGroup/active`,
      { strBoardGUID }
    );
  },

  create: async (
    data: CreateBoardTeamGroup
  ): Promise<BoardTeamGroupSimple> => {
    return await ApiService.post<BoardTeamGroupSimple>(
      `${TASK_API_PREFIX}/BoardTeamGroup`,
      data
    );
  },

  update: async (
    id: string,
    data: UpdateBoardTeamGroup
  ): Promise<BoardTeamGroupSimple> => {
    return await ApiService.put<BoardTeamGroupSimple>(
      `${TASK_API_PREFIX}/BoardTeamGroup/${id}`,
      data
    );
  },

  delete: async (id: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(
      `${TASK_API_PREFIX}/BoardTeamGroup/${id}`
    );
  },

  getAvailableUsers: async (
    strBoardGUID: string,
    strTeamGUID: string,
    params: BaseListParams = {}
  ): Promise<AvailableUsersForTeamGroupResponse> => {
    return await ApiService.getWithMeta<AvailableUsersForTeamGroupResponse>(
      `${TASK_API_PREFIX}/BoardTeamGroup/available-users`,
      { strBoardGUID, strTeamGUID, ...params } as Record<string, unknown>
    );
  },
};
