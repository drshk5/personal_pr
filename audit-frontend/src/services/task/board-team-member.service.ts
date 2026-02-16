import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  BoardTeamMember,
  BoardTeamMemberListResponse,
  BoardTeamMemberParams,
  CreateBoardTeamMember,
  BulkCreateBoardTeamMember,
  BulkDeleteBoardTeamMember,
  BulkDeleteBoardTeamMemberResult,
  UpdateBoardTeamMember,
} from "@/types/task/board-team-member";

export const boardTeamMemberService = {
  /**
   * Get all team members for a specific board with pagination
   */
  getAll: async (
    strBoardGUID: string,
    params: BoardTeamMemberParams = {}
  ): Promise<BoardTeamMemberListResponse> => {
    return await ApiService.getWithMeta<BoardTeamMemberListResponse>(
      `${TASK_API_PREFIX}/BoardTeamMember`,
      { strBoardGUID, ...params } as Record<string, unknown>
    );
  },

  getById: async (id: string): Promise<BoardTeamMember> => {
    return await ApiService.get<BoardTeamMember>(
      `${TASK_API_PREFIX}/BoardTeamMember/${id}`
    );
  },

  create: async (
    data: CreateBoardTeamMember
  ): Promise<BoardTeamMember> => {
    return await ApiService.post<BoardTeamMember>(
      `${TASK_API_PREFIX}/BoardTeamMember`,
      data
    );
  },

  bulkCreate: async (
    data: BulkCreateBoardTeamMember
  ): Promise<BoardTeamMember[]> => {
    return await ApiService.post<BoardTeamMember[]>(
      `${TASK_API_PREFIX}/BoardTeamMember/bulk`,
      data
    );
  },

  bulkDelete: async (
    data: BulkDeleteBoardTeamMember
  ): Promise<BulkDeleteBoardTeamMemberResult> => {
    return await ApiService.deleteWithBody<BulkDeleteBoardTeamMemberResult>(
      `${TASK_API_PREFIX}/BoardTeamMember/bulk-delete`,
      data
    );
  },

  update: async (
    id: string,
    data: UpdateBoardTeamMember
  ): Promise<BoardTeamMember> => {
    return await ApiService.put<BoardTeamMember>(
      `${TASK_API_PREFIX}/BoardTeamMember/${id}`,
      data
    );
  },

  delete: async (id: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(
      `${TASK_API_PREFIX}/BoardTeamMember/${id}`
    );
  },
};
