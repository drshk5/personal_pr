import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  UserDetails,
  UserDetailsListResponse,
  UserDetailsParams,
  UserDetailsCreate,
  UserDetailsBulkCreate,
  BulkUserDetailsResponse,
} from "@/types/central/user-details";

export const userDetailsService = {
  getUserDetails: async (
    params: UserDetailsParams = {}
  ): Promise<UserDetailsListResponse> => {
    return await ApiService.getWithMeta<UserDetailsListResponse>(
      "/UserDetails",
      formatPaginationParams({
        ...params,
      })
    );
  },

  getUserDetail: async (id: string): Promise<UserDetails> => {
    return await ApiService.get<UserDetails>(`/UserDetails/${id}`);
  },

  createUserDetail: async (
    userDetail: UserDetailsCreate
  ): Promise<UserDetails> => {
    return await ApiService.post<UserDetails>("/UserDetails", userDetail);
  },

  deleteUserDetail: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/UserDetails/${id}`);
    return true;
  },

  bulkCreateUserDetails: async (
    bulkData: UserDetailsBulkCreate
  ): Promise<BulkUserDetailsResponse> => {
    return await ApiService.post<BulkUserDetailsResponse>(
      "/UserDetails/bulk",
      bulkData
    );
  },
};
