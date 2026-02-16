import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Department,
  DepartmentCreate,
  DepartmentExportParams,
  DepartmentFilterParams,
  DepartmentListResponse,
  DepartmentSimple,
  DepartmentUpdate,
} from "@/types/central/department";

export const departmentService = {
  getDepartments: async (
    params: DepartmentFilterParams = {}
  ): Promise<DepartmentListResponse> => {
    return await ApiService.getWithMeta<DepartmentListResponse>(
      "/Department",
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getDepartment: async (guid: string): Promise<Department> => {
    return await ApiService.get<Department>(`/Department/${guid}`);
  },

  createDepartment: async (
    department: DepartmentCreate
  ): Promise<Department> => {
    return await ApiService.post<Department>("/Department", department);
  },

  updateDepartment: async (
    guid: string,
    department: DepartmentUpdate
  ): Promise<Department> => {
    return await ApiService.put<Department>(
      `/Department/${guid}`,
      department
    );
  },

  deleteDepartment: async (guid: string): Promise<void> => {
    await ApiService.delete<void>(`/Department/${guid}`);
  },

  getActiveDepartments: async (
    search?: string
  ): Promise<DepartmentSimple[]> => {
    return await ApiService.get<DepartmentSimple[]>("/Department/active", {
      search: search || undefined,
    });
  },

  exportDepartments: async (
    params: DepartmentExportParams
  ): Promise<Blob> => {
    return await ApiService.exportFile(
      "/Department/export",
      {},
      params.format
    );
  },
};
