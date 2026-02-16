import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  BoardSubModuleCreate,
  BoardSubModuleActive,
  BoardSubModuleListResponse,
  BoardSubModuleParams,
  BoardSubModuleUpdate,
  BoardSubModuleResponse,
  BoardSubModuleCreateResponse,
  BoardSubModuleUpdateResponse,
  BoardSubModuleDeleteResponse,
  BulkCreateBoardSubModule,
  BulkCreateBoardSubModuleResponse,
} from "@/types/task/board-sub-module";

export const boardSubModuleService = {
  getBoardSubModules: async (
    params: BoardSubModuleParams = {}
  ): Promise<BoardSubModuleListResponse> => {
    return await ApiService.getWithMeta<BoardSubModuleListResponse>(
      `${TASK_API_PREFIX}/BoardSubModule`,
      params as Record<string, unknown>
    );
  },

  getBoardSubModule: async (id: string): Promise<BoardSubModuleResponse> => {
    return await ApiService.getWithMeta<BoardSubModuleResponse>(
      `${TASK_API_PREFIX}/BoardSubModule/${id}`
    );
  },

  getActiveBoardSubModules: async (
    sectionGuid: string
  ): Promise<BoardSubModuleActive[]> => {
    return await ApiService.get<BoardSubModuleActive[]>(
      `${TASK_API_PREFIX}/BoardSubModule/active`,
      { strBoardSectionGUID: sectionGuid }
    );
  },

  getBoardSubModulesBySection: async (
    sectionGuid: string,
    params: BoardSubModuleParams = {}
  ): Promise<BoardSubModuleListResponse> => {
    return await ApiService.getWithMeta<BoardSubModuleListResponse>(
      `${TASK_API_PREFIX}/BoardSubModule`,
      {
        strBoardSectionGUID: sectionGuid,
        ...params,
      } as Record<string, unknown>
    );
  },

  createBoardSubModule: async (
    boardSubModule: BoardSubModuleCreate
  ): Promise<BoardSubModuleCreateResponse> => {
    return await ApiService.postWithMeta<BoardSubModuleCreateResponse>(
      `${TASK_API_PREFIX}/BoardSubModule`,
      boardSubModule
    );
  },

  bulkCreateBoardSubModules: async (
    payload: BulkCreateBoardSubModule
  ): Promise<BulkCreateBoardSubModuleResponse> => {
    return await ApiService.postWithMeta<BulkCreateBoardSubModuleResponse>(
      `${TASK_API_PREFIX}/BoardSubModule/bulk`,
      payload
    );
  },

  updateBoardSubModule: async (
    id: string,
    boardSubModule: BoardSubModuleUpdate
  ): Promise<BoardSubModuleUpdateResponse> => {
    return await ApiService.putWithMeta<BoardSubModuleUpdateResponse>(
      `${TASK_API_PREFIX}/BoardSubModule/${id}`,
      boardSubModule
    );
  },

  deleteBoardSubModule: async (
    id: string
  ): Promise<BoardSubModuleDeleteResponse> => {
    return await ApiService.deleteWithMeta<BoardSubModuleDeleteResponse>(
      `${TASK_API_PREFIX}/BoardSubModule/${id}`
    );
  },

  copyFromBoardSubModules: async (
    targetBoardSectionGuid: string,
    request: { strSourceBoardSectionGUID: string; strSubModuleGUIDs?: string[] }
  ): Promise<any> => {
    return await ApiService.postWithMeta<any>(
      `${TASK_API_PREFIX}/BoardSubModule/${targetBoardSectionGuid}/copy-from`,
      request
    );
  },
};
