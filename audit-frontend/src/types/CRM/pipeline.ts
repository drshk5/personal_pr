import type { BackendPagedResponse, BaseListParams } from "../common";

// ============================================================
// Pipeline Stage DTO
// ============================================================

export interface PipelineStageDto {
  strStageGUID: string;
  strStageName: string;
  intDisplayOrder: number;
  intProbabilityPercent: number;
  intDefaultDaysToRot: number;
  bolIsWonStage: boolean;
  bolIsLostStage: boolean;
  intOpportunityCount: number;
}

// ============================================================
// Pipeline List DTO
// ============================================================

export interface PipelineListDto {
  strPipelineGUID: string;
  strPipelineName: string;
  strDescription?: string | null;
  bolIsDefault: boolean;
  intStageCount: number;
  intOpportunityCount: number;
  bolIsActive: boolean;
  dtCreatedOn: string;
}

// ============================================================
// Pipeline Detail DTO
// ============================================================

export interface PipelineDetailDto extends PipelineListDto {
  Stages: PipelineStageDto[];
}

// ============================================================
// Create / Update DTOs
// ============================================================

export interface CreatePipelineStageDto {
  strStageName: string;
  intDisplayOrder: number;
  intProbabilityPercent: number;
  intDefaultDaysToRot?: number;
  bolIsWonStage?: boolean;
  bolIsLostStage?: boolean;
}

export interface CreatePipelineDto {
  strPipelineName: string;
  strDescription?: string | null;
  bolIsDefault?: boolean;
  stages: CreatePipelineStageDto[];
}

export interface UpdatePipelineDto extends CreatePipelineDto {}

export interface PipelineFilterParams extends BaseListParams {}

// ============================================================
// Response Types
// ============================================================

export type PipelineListResponse = BackendPagedResponse<PipelineListDto[]>;
