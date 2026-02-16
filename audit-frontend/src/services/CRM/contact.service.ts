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
} from "@/types/CRM/contact";

const CONTACTS_PREFIX = `${CRM_API_PREFIX}/contacts`;

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
    return await ApiService.get<ContactDetailDto>(`${CONTACTS_PREFIX}/${id}`);
  },

  createContact: async (dto: CreateContactDto): Promise<ContactDetailDto> => {
    return await ApiService.post<ContactDetailDto>(CONTACTS_PREFIX, dto);
  },

  updateContact: async (
    id: string,
    dto: UpdateContactDto
  ): Promise<ContactDetailDto> => {
    return await ApiService.put<ContactDetailDto>(
      `${CONTACTS_PREFIX}/${id}`,
      dto
    );
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
};
