import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  Board,
  BoardSimple,
  BoardCreate,
  BoardParams,
  ActiveBoardParams,
  BoardUpdate,
  BoardPagedParams,
  BoardPagedResponse,
  BoardSectionsWithTasksParams,
  BoardWithSectionsAndTasksResponse,
} from "@/types/task/board";

export const boardService = {
  getBoards: async (params: BoardParams = {}): Promise<Board[]> => {
    return await ApiService.get<Board[]>(
      `${TASK_API_PREFIX}/Board`,
      params as Record<string, unknown>
    );
  },

  getBoardsPaged: async (
    params: BoardPagedParams = {}
  ): Promise<BoardPagedResponse> => {
    return await ApiService.getWithMeta<BoardPagedResponse>(
      `${TASK_API_PREFIX}/Board/paged`,
      params as Record<string, unknown>
    );
  },

  getActiveBoards: async (params: ActiveBoardParams = {}): Promise<Board[]> => {
    return await ApiService.get<Board[]>(
      `${TASK_API_PREFIX}/Board/active`,
      params as Record<string, unknown>
    );
  },

  getBoard: async (id: string): Promise<Board> => {
    return await ApiService.get<Board>(`${TASK_API_PREFIX}/Board/${id}`);
  },

  getBoardWithSectionsAndTasks: async (
    boardGuid: string,
    params: BoardSectionsWithTasksParams = {}
  ): Promise<BoardWithSectionsAndTasksResponse> => {
    const query: Record<string, unknown> = { ...params };
    if (Array.isArray(params.status)) {
      query.status = params.status.join(",");
    }

    return await ApiService.getWithMeta<BoardWithSectionsAndTasksResponse>(
      `${TASK_API_PREFIX}/Board/${boardGuid}/sections-with-tasks`,
      query
    );
  },

  createBoard: async (board: BoardCreate): Promise<BoardSimple> => {
    return await ApiService.post<BoardSimple>(
      `${TASK_API_PREFIX}/Board`,
      board
    );
  },

  updateBoard: async (id: string, board: BoardUpdate): Promise<BoardSimple> => {
    return await ApiService.put<BoardSimple>(
      `${TASK_API_PREFIX}/Board/${id}`,
      board
    );
  },

  deleteBoard: async (id: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(`${TASK_API_PREFIX}/Board/${id}`);
  },
};
