import type {
  BaseListParams,
  ApiResponse,
  BackendPagedResponse,
} from "@/types";

export const VIEW_TYPE = {
  Section: "Section",
  Kanban: "Kanban",
  List: "List",
  Calendar: "Calendar",
  Priority: "Priority",
  DueDate: "DueDate",
  Status: "Status",
  Assignee: "Assignee",
  Gantt: "Gantt",
} as const;

export type ViewType = (typeof VIEW_TYPE)[keyof typeof VIEW_TYPE];

export type EntityType = "module";

export interface BoardSection {
  strBoardSectionGUID: string;
  strBoardGUID: string;
  strBoardName?: string | null;
  strName: string;
  strColor?: string | null;
  intPosition: number;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  intSubModuleCount?: number;
  strFormattedCreatedOn?: string;
  strUpdatedByGUID: string;
  strUpdatedByName?: string | null;
  dtUpdatedOn?: string | null;
  strFormattedUpdatedOn?: string | null;
  type: EntityType;
}

export interface BoardSectionSimple {
  strBoardSectionGUID: string;
  strName: string;
}

export interface BoardSectionWithTaskViewPosition extends BoardSection {
  strTaskViewPositionGUID: string;
  intTaskViewPosition?: number;
}

export interface BoardSectionParams extends BaseListParams {
  strBoardGUID?: string;
  strBoardSectionGUID?: string;
  strCreatedByGuid?: string;
  strUpdatedByGuid?: string;
}

export interface BoardSectionCreate {
  strBoardGUID?: string;
  strName: string;
  strColor?: string | null;
  intPosition?: number;
}

export interface BoardSectionUpdate {
  strName: string;
  strColor?: string | null;
  intPosition: number;
}

export interface BulkCreateBoardSection {
  strBoardGUID: string;
  strSectionNames: string;
}

export interface BulkCreateBoardSectionResult {
  RequestedCount: number;
  CreatedCount: number;
  SkippedCount: number;
  SkippedNames: string[];
  CreatedSections: BoardSectionSimple[];
}

export interface ReorderBoardSectionsRequest {
  strBoardGUID: string;
  orderedSectionGUIDs: string[];
}

export interface CopyFromBoardSectionRequest {
  strSourceBoardGUID: string;
  strSectionGUIDs?: string[];
}

export interface SkippedBoardSection {
  strSectionGUID: string;
  strName: string;
  strReason: string;
}

export interface CopyFromBoardSectionResponse {
  CreatedSections: BoardSectionSimple[];
  SkippedSections: SkippedBoardSection[];
}

export type BoardSectionResponse = ApiResponse<BoardSection>;
export type BoardSectionListResponse = BackendPagedResponse<BoardSection[]>;
export type BoardSectionCreateResponse = ApiResponse<BoardSectionSimple>;
export type BoardSectionUpdateResponse = ApiResponse<BoardSectionSimple>;
export type BoardSectionDeleteResponse = ApiResponse<boolean>;
export type BoardSectionReorderResponse = ApiResponse<boolean>;
export type BoardSectionHighestTaskPositionResponse = ApiResponse<
  BoardSectionWithTaskViewPosition | null
>;
export type CopyFromBoardSectionApiResponse =
  ApiResponse<CopyFromBoardSectionResponse>;
export type BulkCreateBoardSectionResponse = ApiResponse<BulkCreateBoardSectionResult>;
