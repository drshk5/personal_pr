import type { ApiResponse } from "@/types";

export interface TaskComment {
  strCommentGUID: string;
  strTaskGUID: string;
  strParentCommentGUID: string | null;
  strContent: string;
  strCreatedByGUID: string;
  strCreatedByName: string | null;
  strProfileImg: string | null;
  dtCreatedOn: string;
  intLikeCount: number;
  intThreadCount: number;
  bolIsPrivate: boolean;
  replies?: TaskComment[];
}

export interface TaskCommentSimple {
  strCommentGUID: string;
  strTaskGUID: string;
  strParentCommentGUID: string | null;
  strContent: string;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  intLikeCount: number;
  intThreadCount: number;
  bolIsPrivate: boolean;
}

export interface CreateTaskComment {
  strTaskGUID: string;
  strParentCommentGUID?: string | null;
  strContent: string;
  bolIsPrivate?: boolean | null;
}

export interface UpdateTaskComment {
  strContent: string;
}

export interface LikeComment {
  isLike: boolean;
}

export type TaskCommentListResponse = ApiResponse<TaskComment[]>;
