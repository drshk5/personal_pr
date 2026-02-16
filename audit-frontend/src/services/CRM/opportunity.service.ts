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

type OpportunityDetailApiResponse = OpportunityDetailDto & {
  Contacts?: OpportunityDetailDto["contacts"];
  RecentActivities?: OpportunityDetailDto["recentActivities"];
};

const normalizeOpportunityDetail = (
  detail: OpportunityDetailApiResponse
): OpportunityDetailDto => ({
  ...detail,
  contacts: detail.contacts ?? detail.Contacts ?? [],
  recentActivities:
    detail.recentActivities ?? detail.RecentActivities ?? [],
});

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
    const response = await ApiService.get<OpportunityDetailApiResponse>(
      `${OPPORTUNITIES_PREFIX}/${id}`
    );
    return normalizeOpportunityDetail(response);
  },

  createOpportunity: async (
    dto: CreateOpportunityDto
  ): Promise<OpportunityDetailDto> => {
    const response = await ApiService.post<OpportunityDetailApiResponse>(
      OPPORTUNITIES_PREFIX,
      dto
    );
    return normalizeOpportunityDetail(response);
  },

  updateOpportunity: async (
    id: string,
    dto: UpdateOpportunityDto
  ): Promise<OpportunityDetailDto> => {
    const response = await ApiService.put<OpportunityDetailApiResponse>(
      `${OPPORTUNITIES_PREFIX}/${id}`,
      dto
    );
    return normalizeOpportunityDetail(response);
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
    const response = await ApiService.patch<OpportunityDetailApiResponse>(
      `${OPPORTUNITIES_PREFIX}/${id}/stage`,
      dto
    );
    return normalizeOpportunityDetail(response);
  },

  closeOpportunity: async (
    id: string,
    dto: CloseOpportunityDto
  ): Promise<OpportunityDetailDto> => {
    const response = await ApiService.post<OpportunityDetailApiResponse>(
      `${OPPORTUNITIES_PREFIX}/${id}/close`,
      dto
    );
    return normalizeOpportunityDetail(response);
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
