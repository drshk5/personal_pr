import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import { CRM_API_PREFIX } from "@/constants/api-prefix";
import type {
  CreateOpportunityDto,
  UpdateOpportunityDto,
  OpportunityDetailDto,
  OpportunityFilterParams,
  OpportunityListResponse,
  OpportunityBulkArchiveDto,
  CloseOpportunityDto,
  MoveStageDto,
  AddOpportunityContactDto,
  OpportunityBoardDto,
} from "@/types/CRM/opportunity";

const OPPORTUNITIES_PREFIX = `${CRM_API_PREFIX}/opportunities`;

export const opportunityService = {
  // ── Core CRUD ──────────────────────────────────────────────

  getOpportunities: async (
    params: OpportunityFilterParams = {}
  ): Promise<OpportunityListResponse> => {
    return await ApiService.getWithMeta<OpportunityListResponse>(
      OPPORTUNITIES_PREFIX,
      formatPaginationParams({ ...params })
    );
  },

  getOpportunity: async (id: string): Promise<OpportunityDetailDto> => {
    return await ApiService.get<OpportunityDetailDto>(
      `${OPPORTUNITIES_PREFIX}/${id}`
    );
  },

  createOpportunity: async (
    dto: CreateOpportunityDto
  ): Promise<OpportunityDetailDto> => {
    return await ApiService.post<OpportunityDetailDto>(
      OPPORTUNITIES_PREFIX,
      dto
    );
  },

  updateOpportunity: async (
    id: string,
    dto: UpdateOpportunityDto
  ): Promise<OpportunityDetailDto> => {
    return await ApiService.put<OpportunityDetailDto>(
      `${OPPORTUNITIES_PREFIX}/${id}`,
      dto
    );
  },

  deleteOpportunity: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${OPPORTUNITIES_PREFIX}/${id}`);
    return true;
  },

  // ── Stage Management ────────────────────────────────────────

  moveStage: async (
    id: string,
    dto: MoveStageDto
  ): Promise<OpportunityDetailDto> => {
    return await ApiService.patch<OpportunityDetailDto>(
      `${OPPORTUNITIES_PREFIX}/${id}/stage`,
      dto
    );
  },

  closeOpportunity: async (
    id: string,
    dto: CloseOpportunityDto
  ): Promise<OpportunityDetailDto> => {
    return await ApiService.post<OpportunityDetailDto>(
      `${OPPORTUNITIES_PREFIX}/${id}/close`,
      dto
    );
  },

  // ── Contact Management ──────────────────────────────────────

  addContact: async (
    opportunityId: string,
    dto: AddOpportunityContactDto
  ): Promise<boolean> => {
    await ApiService.post<void>(
      `${OPPORTUNITIES_PREFIX}/${opportunityId}/contacts`,
      dto
    );
    return true;
  },

  removeContact: async (
    opportunityId: string,
    contactId: string
  ): Promise<boolean> => {
    await ApiService.delete<void>(
      `${OPPORTUNITIES_PREFIX}/${opportunityId}/contacts/${contactId}`
    );
    return true;
  },

  // ── Board / Kanban View ─────────────────────────────────────

  getBoard: async (pipelineId: string): Promise<OpportunityBoardDto[]> => {
    return await ApiService.getArray<OpportunityBoardDto>(
      `${OPPORTUNITIES_PREFIX}/board/${pipelineId}`
    );
  },

  // ── Bulk Operations ────────────────────────────────────────

  bulkArchive: async (dto: OpportunityBulkArchiveDto): Promise<boolean> => {
    await ApiService.post<void>(
      `${OPPORTUNITIES_PREFIX}/bulk-archive`,
      dto
    );
    return true;
  },

  bulkRestore: async (dto: OpportunityBulkArchiveDto): Promise<boolean> => {
    await ApiService.post<void>(
      `${OPPORTUNITIES_PREFIX}/bulk-restore`,
      dto
    );
    return true;
  },
};
