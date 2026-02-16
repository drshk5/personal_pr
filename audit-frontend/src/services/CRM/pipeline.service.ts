import { ApiService } from "@/lib/api/api-service";
import { CRM_API_PREFIX } from "@/constants/api-prefix";
import type {
  PipelineListDto,
  PipelineDetailDto,
  CreatePipelineDto,
  UpdatePipelineDto,
} from "@/types/CRM/pipeline";

const PIPELINES_PREFIX = `${CRM_API_PREFIX}/pipelines`;

export const pipelineService = {
  // ── Core CRUD ──────────────────────────────────────────────

  getPipelines: async (): Promise<PipelineListDto[]> => {
    return await ApiService.getArray<PipelineListDto>(PIPELINES_PREFIX);
  },

  getPipeline: async (id: string): Promise<PipelineDetailDto> => {
    return await ApiService.get<PipelineDetailDto>(`${PIPELINES_PREFIX}/${id}`);
  },

  createPipeline: async (
    dto: CreatePipelineDto
  ): Promise<PipelineDetailDto> => {
    return await ApiService.post<PipelineDetailDto>(PIPELINES_PREFIX, dto);
  },

  updatePipeline: async (
    id: string,
    dto: UpdatePipelineDto
  ): Promise<PipelineDetailDto> => {
    return await ApiService.put<PipelineDetailDto>(
      `${PIPELINES_PREFIX}/${id}`,
      dto
    );
  },

  deletePipeline: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${PIPELINES_PREFIX}/${id}`);
    return true;
  },

  setDefaultPipeline: async (id: string): Promise<PipelineDetailDto> => {
    return await ApiService.post<PipelineDetailDto>(
      `${PIPELINES_PREFIX}/${id}/set-default`,
      {}
    );
  },
};
