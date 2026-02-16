import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Unit,
  UnitCreate,
  UnitListResponse,
  UnitParams,
  UnitSimple,
  UnitUpdate,
} from "@/types/Account/unit";

export const unitService = {
  getUnits: async (params: UnitParams = {}): Promise<UnitListResponse> => {
    return await ApiService.getWithMeta<UnitListResponse>(
      `${ACCOUNT_API_PREFIX}/Unit`,
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getActiveUnits: async (): Promise<Unit[]> => {
    return await ApiService.get<Unit[]>(`${ACCOUNT_API_PREFIX}/Unit/active`);
  },

  getUnit: async (id: string): Promise<Unit> => {
    return await ApiService.get<Unit>(`${ACCOUNT_API_PREFIX}/Unit/${id}`);
  },

  createUnit: async (unit: UnitCreate): Promise<UnitSimple> => {
    return await ApiService.post<UnitSimple>(
      `${ACCOUNT_API_PREFIX}/Unit`,
      unit
    );
  },

  updateUnit: async (id: string, unit: UnitUpdate): Promise<UnitSimple> => {
    return await ApiService.put<UnitSimple>(
      `${ACCOUNT_API_PREFIX}/Unit/${id}`,
      unit
    );
  },

  deleteUnit: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${ACCOUNT_API_PREFIX}/Unit/${id}`);
    return true;
  },
};
