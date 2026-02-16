import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  BoardSectionCreate,
  BoardSectionListResponse,
  BoardSectionParams,
  BoardSectionUpdate,
  ReorderBoardSectionsRequest,
  BoardSectionResponse,
  BoardSectionCreateResponse,
  BoardSectionUpdateResponse,
  BoardSectionDeleteResponse,
  BoardSectionReorderResponse,
  CopyFromBoardSectionRequest,
  CopyFromBoardSectionApiResponse,
  BoardSectionHighestTaskPositionResponse,
  BulkCreateBoardSection,
  BulkCreateBoardSectionResponse,
} from "@/types/task/board-section";

export const boardSectionService = {
  getBoardSections: async (
    params: BoardSectionParams = {}
  ): Promise<BoardSectionListResponse> => {
    return await ApiService.getWithMeta<BoardSectionListResponse>(
      `${TASK_API_PREFIX}/BoardSection`,
      params as Record<string, unknown>
    );
  },

  getBoardSection: async (id: string): Promise<BoardSectionResponse> => {
    return await ApiService.getWithMeta<BoardSectionResponse>(
      `${TASK_API_PREFIX}/BoardSection/${id}`
    );
  },

  getBoardSectionWithHighestTaskPosition: async (
    boardGuid: string
  ): Promise<BoardSectionHighestTaskPositionResponse> => {
    return await ApiService.getWithMeta<BoardSectionHighestTaskPositionResponse>(
      `${TASK_API_PREFIX}/BoardSection/highest-task-position`,
      { strBoardGUID: boardGuid }
    );
  },

  getBoardSectionsByBoardGuid: async (
    boardGuid: string,
    params: BoardSectionParams = {}
  ): Promise<BoardSectionListResponse> => {
    return await ApiService.getWithMeta<BoardSectionListResponse>(
      `${TASK_API_PREFIX}/BoardSection`,
      { strBoardGUID: boardGuid, ...params } as Record<string, unknown>
    );
  },

  createBoardSection: async (
    boardSection: BoardSectionCreate
  ): Promise<BoardSectionCreateResponse> => {
    return await ApiService.postWithMeta<BoardSectionCreateResponse>(
      `${TASK_API_PREFIX}/BoardSection`,
      boardSection
    );
  },

  bulkCreateBoardSections: async (
    payload: BulkCreateBoardSection
  ): Promise<BulkCreateBoardSectionResponse> => {
    return await ApiService.postWithMeta<BulkCreateBoardSectionResponse>(
      `${TASK_API_PREFIX}/BoardSection/bulk`,
      payload
    );
  },

  updateBoardSection: async (
    id: string,
    boardSection: BoardSectionUpdate
  ): Promise<BoardSectionUpdateResponse> => {
    return await ApiService.putWithMeta<BoardSectionUpdateResponse>(
      `${TASK_API_PREFIX}/BoardSection/${id}`,
      boardSection
    );
  },

  deleteBoardSection: async (
    id: string
  ): Promise<BoardSectionDeleteResponse> => {
    return await ApiService.deleteWithMeta<BoardSectionDeleteResponse>(
      `${TASK_API_PREFIX}/BoardSection/${id}`
    );
  },

  reorderBoardSections: async (
    boardGuid: string,
    orderedSectionGUIDs: string[]
  ): Promise<BoardSectionReorderResponse> => {
    const request: ReorderBoardSectionsRequest = {
      strBoardGUID: boardGuid,
      orderedSectionGUIDs,
    };
    return await ApiService.postWithMeta<BoardSectionReorderResponse>(
      `${TASK_API_PREFIX}/BoardSection/reorder`,
      request
    );
  },

  copyFromBoardSections: async (
    targetBoardGuid: string,
    request: CopyFromBoardSectionRequest
  ): Promise<CopyFromBoardSectionApiResponse> => {
    return await ApiService.postWithMeta<CopyFromBoardSectionApiResponse>(
      `${TASK_API_PREFIX}/BoardSection/${targetBoardGuid}/copy-from`,
      request
    );
  },
};
