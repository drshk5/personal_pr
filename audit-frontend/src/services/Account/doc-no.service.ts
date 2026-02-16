import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  DocNo,
  DocNoCreate,
  DocNoListResponse,
  DocNoParams,
  DocNoUpdate,
  DocNoCopyFromRequest,
  DocNoGenerateRequest,
  DocNoGenerateResponse,
} from "@/types/Account/doc-no";
import type { ApiResponse } from "@/types";

export const docNoService = {
  getDocNos: async (params: DocNoParams = {}): Promise<DocNoListResponse> => {
    return await ApiService.getWithMeta<DocNoListResponse>(
      `${ACCOUNT_API_PREFIX}/DocNo`,
      formatPaginationParams({
        ...params,
      })
    );
  },

  getDocNo: async (id: string): Promise<ApiResponse<DocNo>> => {
    return await ApiService.get<ApiResponse<DocNo>>(
      `${ACCOUNT_API_PREFIX}/DocNo/${id}`
    );
  },

  createDocNo: async (docNo: DocNoCreate): Promise<ApiResponse<DocNo>> => {
    return await ApiService.post<ApiResponse<DocNo>>(
      `${ACCOUNT_API_PREFIX}/DocNo`,
      docNo
    );
  },

  updateDocNo: async (
    id: string,
    docNo: DocNoUpdate
  ): Promise<ApiResponse<DocNo>> => {
    return await ApiService.put<ApiResponse<DocNo>>(
      `${ACCOUNT_API_PREFIX}/DocNo/${id}`,
      docNo
    );
  },

  deleteDocNo: async (id: string): Promise<ApiResponse<boolean>> => {
    return await ApiService.delete<ApiResponse<boolean>>(
      `${ACCOUNT_API_PREFIX}/DocNo/${id}`
    );
  },

  copyDocNosFromYear: async (
    request: DocNoCopyFromRequest
  ): Promise<ApiResponse<boolean>> => {
    return await ApiService.post<ApiResponse<boolean>>(
      `${ACCOUNT_API_PREFIX}/DocNo/copyfrom`,
      request
    );
  },

  generateDocNo: async (
    request: DocNoGenerateRequest
  ): Promise<ApiResponse<DocNoGenerateResponse>> => {
    return await ApiService.post<ApiResponse<DocNoGenerateResponse>>(
      `${ACCOUNT_API_PREFIX}/DocNo/generate`,
      request
    );
  },
};
