import type { BackendPagedResponse, BaseListParams } from "@/types";

export type EntityType = "project";

export interface Board {
  strBoardGUID: string;
  strName: string;
  strDescription: string;
  bolIsActive: boolean;
  strOrganizationGUID: string;
  strYearGUID: string;
  strGroupGUID: string;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strFormattedCreatedOn?: string;
  strUpdatedByGUID: string;
  strUpdatedByName?: string | null;
  dtUpdatedOn: string;
  strFormattedUpdatedOn?: string;
  type: EntityType;
}

export interface BoardSimple {
  strBoardGUID: string;
  strName: string;
  strDescription: string;
  bolIsActive: boolean;
  dtCreatedOn: string;
  dtUpdatedOn: string;
  strFormattedCreatedOn?: string;
  strFormattedUpdatedOn?: string;
  type?: EntityType;
}

export interface BoardCreate {
  strName: string;
  strDescription?: string;
  bolIsActive: boolean;
}

export interface BoardParams {
  search?: string;
  bolIsActive?: boolean | null;
  strBoardGUID?: string;
  strCreatedByGUID?: string;
  strUpdatedByGUID?: string;
}

export interface ActiveBoardParams {
  search?: string;
}

export interface BoardUpdate extends BoardCreate {
  strBoardGUID?: string;
}

export type BoardPagedParams = BaseListParams & BoardParams;

export interface BoardSectionSummary {
  strBoardSectionGUID: string;
  strBoardSectionName: string;
}

export interface TagSummary {
  strTagGUID: string;
  strTagName: string;
  strTagColor?: string | null;
}

export interface TaskSummary {
  strTaskGUID: string;
  strTaskName: string;
  strDescription?: string | null;
  strStatus: string;
  strPriority: string;
  dtStartDate?: string | null;
  dtDueDate?: string | null;
  intDisplayOrder: number;
  assignedToGUID?: string | null;
  assignedToName?: string | null;
  assignedByGUID?: string | null;
  assignedByName?: string | null;
  section?: BoardSectionSummary | null;
  tags: TagSummary[];
}

export interface SectionWithTasks {
  strBoardSectionGUID: string;
  strBoardSectionName: string;
  strColor?: string | null;
  intDisplayOrder: number;
  intTaskCount: number;
  tasks: TaskSummary[];
}

export interface BoardWithSectionsAndTasks {
  strBoardGUID: string;
  strBoardName: string;
  intTotalTaskCount: number;
  sections: SectionWithTasks[];
}

export interface BoardSectionsWithTasksParams {
  status?: string | string[];
  pageNumber?: number;
  pageSize?: number;
}

export type BoardPagedResponse = BackendPagedResponse<Board[]>;
export type BoardWithSectionsAndTasksResponse =
  BackendPagedResponse<BoardWithSectionsAndTasks>;
