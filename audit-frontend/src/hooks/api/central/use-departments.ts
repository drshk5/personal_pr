import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentService } from "@/services/central/department.service";
import type {
  DepartmentCreate,
  DepartmentExportParams,
  DepartmentFilterParams,
  DepartmentUpdate,
} from "@/types/central/department";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const departmentQueryKeys = createQueryKeys("departments");

export const activeDepartmentsKey = "departments";

export const useDepartments = (
  params?: DepartmentFilterParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: departmentQueryKeys.list(params || {}),
    queryFn: () => departmentService.getDepartments(params),
    enabled,
  });
};

export const useDepartment = (guid?: string) => {
  return useQuery({
    queryKey: departmentQueryKeys.detail(guid || ""),
    queryFn: () => departmentService.getDepartment(guid!),
    enabled: !!guid,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (department: DepartmentCreate) =>
      departmentService.createDepartment(department),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...departmentQueryKeys.all, "active"],
      });
      toast.success("Department created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create department"),
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ guid, data }: { guid: string; data: DepartmentUpdate }) =>
      departmentService.updateDepartment(guid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...departmentQueryKeys.all, "active"],
      });
      toast.success("Department updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update department"),
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (guid: string) => departmentService.deleteDepartment(guid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...departmentQueryKeys.all, "active"],
      });
      toast.success("Department deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete department"),
  });
};

export const useActiveDepartments = (
  search?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: search
      ? [...departmentQueryKeys.all, "active", search]
      : [...departmentQueryKeys.all, "active"],
    queryFn: () => departmentService.getActiveDepartments(search),
    staleTime: 60 * 60 * 1000, // 1 hour

    enabled,
  });
};

export const useExportDepartments = () => {
  return useMutation({
    mutationFn: (params: DepartmentExportParams) =>
      departmentService.exportDepartments(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `departments-${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Departments exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to export departments");
    },
  });
};
