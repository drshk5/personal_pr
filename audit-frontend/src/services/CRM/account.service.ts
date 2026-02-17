import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import { CRM_API_PREFIX } from "@/constants/api-prefix";
import type {
  CreateAccountDto,
  UpdateAccountDto,
  AccountDetailDto,
  AccountFilterParams,
  AccountBulkArchiveDto,
  AccountListResponse,
  AccountImportResultDto,
  AccountSuggestMappingResultDto,
  AccountDuplicateHandling,
} from "@/types/CRM/account";

const ACCOUNTS_PREFIX = `${CRM_API_PREFIX}/accounts`;

type AccountDetailApiResponse = AccountDetailDto & {
  Contacts?: AccountDetailDto["contacts"];
  Opportunities?: AccountDetailDto["opportunities"];
  AllActivities?: AccountDetailDto["allActivities"];
  RecentActivities?: AccountDetailDto["recentActivities"];
};

const normalizeAccountDetail = (
  detail: AccountDetailApiResponse
): AccountDetailDto => ({
  ...detail,
  intActivityCount: detail.intActivityCount ?? 0,
  intOverdueActivityCount: detail.intOverdueActivityCount ?? 0,
  contacts: detail.contacts ?? detail.Contacts ?? [],
  opportunities: detail.opportunities ?? detail.Opportunities ?? [],
  allActivities: detail.allActivities ?? detail.AllActivities ?? [],
  recentActivities: detail.recentActivities ?? detail.RecentActivities ?? [],
});

export const accountService = {
  // ── Core CRUD ──────────────────────────────────────────────

  getAccounts: async (
    params: AccountFilterParams = {}
  ): Promise<AccountListResponse> => {
    return await ApiService.getWithMeta<AccountListResponse>(
      ACCOUNTS_PREFIX,
      formatPaginationParams({ ...params })
    );
  },

  getAccount: async (id: string): Promise<AccountDetailDto> => {
    const response = await ApiService.get<AccountDetailApiResponse>(
      `${ACCOUNTS_PREFIX}/${id}`
    );
    return normalizeAccountDetail(response);
  },

  createAccount: async (dto: CreateAccountDto): Promise<AccountDetailDto> => {
    const response = await ApiService.post<AccountDetailApiResponse>(
      ACCOUNTS_PREFIX,
      dto
    );
    return normalizeAccountDetail(response);
  },

  updateAccount: async (
    id: string,
    dto: UpdateAccountDto
  ): Promise<AccountDetailDto> => {
    const response = await ApiService.put<AccountDetailApiResponse>(
      `${ACCOUNTS_PREFIX}/${id}`,
      dto
    );
    return normalizeAccountDetail(response);
  },

  deleteAccount: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${ACCOUNTS_PREFIX}/${id}`);
    return true;
  },

  // ── Bulk Operations ────────────────────────────────────────

  bulkArchive: async (dto: AccountBulkArchiveDto): Promise<boolean> => {
    await ApiService.post<void>(`${ACCOUNTS_PREFIX}/bulk-archive`, dto);
    return true;
  },

  bulkRestore: async (dto: AccountBulkArchiveDto): Promise<boolean> => {
    await ApiService.post<void>(`${ACCOUNTS_PREFIX}/bulk-restore`, dto);
    return true;
  },

  // ── Import / Export ────────────────────────────────────────

  importAccounts: async (
    file: File,
    columnMapping: Record<string, string>,
    duplicateHandling: AccountDuplicateHandling = "Skip"
  ): Promise<AccountImportResultDto> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("strDuplicateHandling", duplicateHandling);
    formData.append("columnMappingJson", JSON.stringify(columnMapping));

    const response = await api.post<{ data: AccountImportResultDto }>(
      `${ACCOUNTS_PREFIX}/import`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return response.data.data;
  },

  suggestImportMapping: async (
    file: File
  ): Promise<AccountSuggestMappingResultDto> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<{ data: AccountSuggestMappingResultDto }>(
      `${ACCOUNTS_PREFIX}/import/suggest-mapping`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return response.data.data;
  },

  exportAccounts: async (params: AccountFilterParams = {}): Promise<Blob> => {
    return await ApiService.exportFilePost(
      `${ACCOUNTS_PREFIX}/export`,
      formatPaginationParams({ ...params }) as Record<string, unknown>
    );
  },
};
