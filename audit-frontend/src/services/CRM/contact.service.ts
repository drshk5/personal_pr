import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import { CRM_API_PREFIX } from "@/constants/api-prefix";
import type {
  CreateContactDto,
  UpdateContactDto,
  ContactDetailDto,
  ContactFilterParams,
  ContactBulkArchiveDto,
  ContactListResponse,
  ContactImportResultDto,
  ContactSuggestMappingResultDto,
  ContactDuplicateHandling,
} from "@/types/CRM/contact";

const CONTACTS_PREFIX = `${CRM_API_PREFIX}/contacts`;

type ContactDetailApiResponse = ContactDetailDto & {
  Opportunities?: ContactDetailDto["opportunities"];
  RecentActivities?: ContactDetailDto["recentActivities"];
};

const normalizeContactDetail = (
  detail: ContactDetailApiResponse
): ContactDetailDto => ({
  ...detail,
  opportunities: detail.opportunities ?? detail.Opportunities ?? [],
  recentActivities: detail.recentActivities ?? detail.RecentActivities ?? [],
});

export const contactService = {
  // ── Core CRUD ──────────────────────────────────────────────

  getContacts: async (
    params: ContactFilterParams = {}
  ): Promise<ContactListResponse> => {
    return await ApiService.getWithMeta<ContactListResponse>(
      CONTACTS_PREFIX,
      formatPaginationParams({ ...params })
    );
  },

  getContact: async (id: string): Promise<ContactDetailDto> => {
    const response = await ApiService.get<ContactDetailApiResponse>(
      `${CONTACTS_PREFIX}/${id}`
    );
    return normalizeContactDetail(response);
  },

  createContact: async (dto: CreateContactDto): Promise<ContactDetailDto> => {
    const response = await ApiService.post<ContactDetailApiResponse>(
      CONTACTS_PREFIX,
      dto
    );
    return normalizeContactDetail(response);
  },

  updateContact: async (
    id: string,
    dto: UpdateContactDto
  ): Promise<ContactDetailDto> => {
    const response = await ApiService.put<ContactDetailApiResponse>(
      `${CONTACTS_PREFIX}/${id}`,
      dto
    );
    return normalizeContactDetail(response);
  },

  deleteContact: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${CONTACTS_PREFIX}/${id}`);
    return true;
  },

  // ── Bulk Operations ────────────────────────────────────────

  bulkArchive: async (dto: ContactBulkArchiveDto): Promise<boolean> => {
    await ApiService.post<void>(`${CONTACTS_PREFIX}/bulk-archive`, dto);
    return true;
  },

  bulkRestore: async (dto: ContactBulkArchiveDto): Promise<boolean> => {
    await ApiService.post<void>(`${CONTACTS_PREFIX}/bulk-restore`, dto);
    return true;
  },

  // ── Import / Export ────────────────────────────────────────

  importContacts: async (
    file: File,
    columnMapping: Record<string, string>,
    duplicateHandling: ContactDuplicateHandling = "Skip"
  ): Promise<ContactImportResultDto> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("strDuplicateHandling", duplicateHandling);
    formData.append("columnMappingJson", JSON.stringify(columnMapping));

    const response = await api.post<{ data: ContactImportResultDto }>(
      `${CONTACTS_PREFIX}/import`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return response.data.data;
  },

  suggestImportMapping: async (
    file: File
  ): Promise<ContactSuggestMappingResultDto> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<{ data: ContactSuggestMappingResultDto }>(
      `${CONTACTS_PREFIX}/import/suggest-mapping`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return response.data.data;
  },

  exportContacts: async (params: ContactFilterParams = {}): Promise<Blob> => {
    return await ApiService.exportFilePost(
      `${CONTACTS_PREFIX}/export`,
      formatPaginationParams({ ...params }) as Record<string, unknown>
    );
  },
};
