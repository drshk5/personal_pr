import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  UserHourlyRate,
  UserHourlyRateCreate,
  UserHourlyRateUpdate,
  UserHourlyRateParams,
  UserHourlyRateSimple,
  UserHourlyRateListResponse,
} from "@/types/task/user-hourly-rate";

export const userHourlyRateService = {
  getUserHourlyRates: async (
    params: UserHourlyRateParams = {}
  ): Promise<UserHourlyRateListResponse> => {
    return await ApiService.getWithMeta<UserHourlyRateListResponse>(
      `${TASK_API_PREFIX}/UserHourlyRate`,
      params as Record<string, unknown>
    );
  },

  getUserHourlyRate: async (guid: string): Promise<UserHourlyRate> => {
    return await ApiService.get<UserHourlyRate>(
      `${TASK_API_PREFIX}/UserHourlyRate/${guid}`
    );
  },

  getActiveUserHourlyRates: async (): Promise<UserHourlyRate[]> => {
    return await ApiService.get<UserHourlyRate[]>(
      `${TASK_API_PREFIX}/UserHourlyRate/active`
    );
  },

  createUserHourlyRate: async (
    data: UserHourlyRateCreate
  ): Promise<UserHourlyRateSimple> => {
    return await ApiService.post<UserHourlyRateSimple>(
      `${TASK_API_PREFIX}/UserHourlyRate`,
      data
    );
  },

  updateUserHourlyRate: async (
    guid: string,
    data: UserHourlyRateUpdate
  ): Promise<UserHourlyRateSimple> => {
    return await ApiService.put<UserHourlyRateSimple>(
      `${TASK_API_PREFIX}/UserHourlyRate/${guid}`,
      data
    );
  },

  deleteUserHourlyRate: async (guid: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(
      `${TASK_API_PREFIX}/UserHourlyRate/${guid}`
    );
  },
};
