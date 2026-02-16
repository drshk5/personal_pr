import type { ApiPagedResponse, BaseListParams } from "@/types";

export interface TaskChecklist {
  strTaskChecklistGUID: string;
  strTaskGUID: string;
  strTitle: string;
  dtDueDate?: string | null;
  strAssignedToGUID?: string | null;
  strAssignedToName?: string | null;
  bolIsCompleted: boolean;
  intPosition: number;
  dtCompletedOn?: string | null;
  strCompletedByGUID?: string | null;
  strCompletedByName?: string | null;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  dtUpdatedOn: string;
}

export interface TaskChecklistSimple {
  strTaskChecklistGUID: string;
  strTaskGUID: string;
  strTitle: string;
  dtDueDate?: string | null;
  strAssignedToGUID?: string | null;
  bolIsCompleted: boolean;
  intPosition: number;
}

export interface TaskChecklistParams extends BaseListParams {
  strTaskGUID?: string;
  bolIsCompleted?: boolean;
  strAssignedToGUIDs?: string | string[];
  strCreatedByGUIDs?: string | string[];
  strUpdatedByGUIDs?: string | string[];
}

export interface TaskChecklistCreate {
  strTaskGUID: string;
  strTitle: string;
  dtDueDate?: string | null;
  strAssignedToGUID?: string | null;
  intPosition?: number;
}

export type TaskChecklistUpdate = Partial<
  Omit<TaskChecklistCreate, "strTaskGUID">
> & {
  bolIsCompleted?: boolean;
};

export type TaskChecklistListResponse = ApiPagedResponse<TaskChecklist>;
