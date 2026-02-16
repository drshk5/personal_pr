import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import { CRM_API_PREFIX } from "@/constants/api-prefix";
import type {
  CreateLeadDto,
  UpdateLeadDto,
  LeadListDto,
  LeadDetailDto,
  LeadFilterParams,
  LeadBulkArchiveDto,
  LeadListResponse,
  ConvertLeadDto,
  LeadConversionResultDto,
  DuplicateCheckResultDto,
  LeadMergeDto,
  LeadMergeResultDto,
  LeadImportResultDto,
  LeadImportMappingDto,
  BulkAssignDto,
  AutoAssignResultDto,
  LeadAssignmentRuleDto,
  LeadAnalyticsDto,
  LeadSLAConfigDto,
  LeadScoringRuleDto,
  CreateScoringRuleDto,
  UpdateScoringRuleDto,
} from "@/types/CRM/lead";

const LEADS_PREFIX = `${CRM_API_PREFIX}/leads`;
const LEAD_CONVERSION_PREFIX = `${CRM_API_PREFIX}/lead-conversion`;

type LeadDetailApiResponse = LeadDetailDto & {
  RecentActivities?: LeadDetailDto["recentActivities"];
  ScoreBreakdown?: LeadDetailDto["scoreBreakdown"];
  Duplicates?: LeadDetailDto["duplicates"];
};

const normalizeLeadDetail = (detail: LeadDetailApiResponse): LeadDetailDto => ({
  ...detail,
  recentActivities:
    detail.recentActivities ?? detail.RecentActivities ?? [],
  scoreBreakdown: detail.scoreBreakdown ?? detail.ScoreBreakdown,
  duplicates: detail.duplicates ?? detail.Duplicates,
});

export const leadService = {
  // ── Core CRUD ──────────────────────────────────────────────

  getLeads: async (
    params: LeadFilterParams = {}
  ): Promise<LeadListResponse> => {
    return await ApiService.getWithMeta<LeadListResponse>(
      LEADS_PREFIX,
      formatPaginationParams({ ...params })
    );
  },

  getLead: async (id: string): Promise<LeadDetailDto> => {
    const response = await ApiService.get<LeadDetailApiResponse>(
      `${LEADS_PREFIX}/${id}`
    );
    return normalizeLeadDetail(response);
  },

  createLead: async (dto: CreateLeadDto): Promise<LeadDetailDto> => {
    const response = await ApiService.post<LeadDetailApiResponse>(
      LEADS_PREFIX,
      dto
    );
    return normalizeLeadDetail(response);
  },

  updateLead: async (
    id: string,
    dto: UpdateLeadDto
  ): Promise<LeadDetailDto> => {
    const response = await ApiService.put<LeadDetailApiResponse>(
      `${LEADS_PREFIX}/${id}`,
      dto
    );
    return normalizeLeadDetail(response);
  },

  deleteLead: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${LEADS_PREFIX}/${id}`);
    return true;
  },

  changeStatus: async (
    id: string,
    status: string
  ): Promise<LeadDetailDto> => {
    const response = await ApiService.patch<LeadDetailApiResponse>(
      `${LEADS_PREFIX}/${id}/status`,
      { strStatus: status }
    );
    return normalizeLeadDetail(response);
  },

  // ── Bulk Operations ────────────────────────────────────────

  bulkArchive: async (dto: LeadBulkArchiveDto): Promise<boolean> => {
    await ApiService.post<void>(`${LEADS_PREFIX}/bulk-archive`, dto);
    return true;
  },

  bulkRestore: async (dto: LeadBulkArchiveDto): Promise<boolean> => {
    await ApiService.post<void>(`${LEADS_PREFIX}/bulk-restore`, dto);
    return true;
  },

  // ── Lead Conversion ────────────────────────────────────────

  convertLead: async (
    dto: ConvertLeadDto
  ): Promise<LeadConversionResultDto> => {
    return await ApiService.post<LeadConversionResultDto>(
      `${LEAD_CONVERSION_PREFIX}/convert`,
      dto
    );
  },

  getConversionPreview: async (
    leadId: string
  ): Promise<LeadListDto> => {
    return await ApiService.get<LeadListDto>(
      `${LEAD_CONVERSION_PREFIX}/${leadId}/preview`
    );
  },

  // ── Duplicate Detection & Merge ────────────────────────────

  checkDuplicates: async (
    email: string,
    firstName?: string,
    lastName?: string
  ): Promise<DuplicateCheckResultDto> => {
    return await ApiService.get<DuplicateCheckResultDto>(
      `${LEADS_PREFIX}/check-duplicates`,
      {
        email,
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      }
    );
  },

  mergeLeads: async (dto: LeadMergeDto): Promise<LeadMergeResultDto> => {
    return await ApiService.post<LeadMergeResultDto>(
      `${LEADS_PREFIX}/merge`,
      dto
    );
  },

  // ── Import / Export ────────────────────────────────────────

  importLeads: async (
    file: File,
    mappings: LeadImportMappingDto[],
    duplicateHandling: string = "Skip"
  ): Promise<LeadImportResultDto> => {
    // Convert the array-style mappings to the Dictionary<string,string> the backend expects
    const columnMapping: Record<string, string> = {};
    for (const m of mappings) {
      columnMapping[m.strCsvColumn] = m.strLeadField;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("columnMappingJson", JSON.stringify(columnMapping));
    formData.append("strDuplicateHandling", duplicateHandling);

    const response = await api.post<{ data: LeadImportResultDto }>(
      `${LEADS_PREFIX}/import`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data.data;
  },

  exportLeads: async (
    params: LeadFilterParams = {},
    _format: "csv" | "excel" = "csv"
  ): Promise<Blob> => {
    return await ApiService.exportFilePost(
      `${LEADS_PREFIX}/export`,
      formatPaginationParams({ ...params }) as Record<string, unknown>
    );
  },

  /**
   * Generate a CSV import template client-side.
   * The backend doesn't expose a dedicated template endpoint — we simply
   * build one from the LEAD_IMPORTABLE_FIELDS definition.
   */
  downloadImportTemplate: async (): Promise<Blob> => {
    const { LEAD_IMPORTABLE_FIELDS } = await import("@/types/CRM/lead");
    const headers = LEAD_IMPORTABLE_FIELDS.map((f) => f.label).join(",");
    const csv = headers + "\n";
    return new Blob([csv], { type: "text/csv" });
  },

  // ── Assignment ─────────────────────────────────────────────

  bulkAssign: async (dto: BulkAssignDto): Promise<boolean> => {
    await ApiService.post<void>(`${LEADS_PREFIX}/bulk-assign`, dto);
    return true;
  },

  autoAssign: async (guids: string[]): Promise<AutoAssignResultDto> => {
    return await ApiService.post<AutoAssignResultDto>(
      `${LEADS_PREFIX}/auto-assign`,
      { guids }
    );
  },

  getAssignmentRules: async (): Promise<LeadAssignmentRuleDto[]> => {
    return await ApiService.getArray<LeadAssignmentRuleDto>(
      `${LEADS_PREFIX}/assignment-rules`
    );
  },

  // ── Analytics & Funnel ─────────────────────────────────────

  getAnalytics: async (
    dtFromDate?: string,
    dtToDate?: string
  ): Promise<LeadAnalyticsDto> => {
    return await ApiService.get<LeadAnalyticsDto>(
      `${LEADS_PREFIX}/analytics`,
      {
        ...(dtFromDate && { dtFromDate }),
        ...(dtToDate && { dtToDate }),
      }
    );
  },

  // ── SLA / Aging ────────────────────────────────────────────

  getSLAConfig: async (): Promise<LeadSLAConfigDto> => {
    return await ApiService.get<LeadSLAConfigDto>(
      `${LEADS_PREFIX}/sla-config`
    );
  },

  // ── Scoring Rules ──────────────────────────────────────────

  getScoringRules: async (): Promise<LeadScoringRuleDto[]> => {
    return await ApiService.getArray<LeadScoringRuleDto>(
      `${LEADS_PREFIX}/scoring-rules`
    );
  },

  createScoringRule: async (
    dto: CreateScoringRuleDto
  ): Promise<LeadScoringRuleDto> => {
    return await ApiService.post<LeadScoringRuleDto>(
      `${LEADS_PREFIX}/scoring-rules`,
      dto
    );
  },

  updateScoringRule: async (
    id: string,
    dto: UpdateScoringRuleDto
  ): Promise<LeadScoringRuleDto> => {
    return await ApiService.put<LeadScoringRuleDto>(
      `${LEADS_PREFIX}/scoring-rules/${id}`,
      dto
    );
  },

  deleteScoringRule: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${LEADS_PREFIX}/scoring-rules/${id}`);
    return true;
  },
};
