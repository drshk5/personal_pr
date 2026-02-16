import { useMutation, useQuery } from "@tanstack/react-query";
import { scheduleService } from "@/services/central/schedule.service";
import type {
  ScheduleCreate,
  ScheduleExportParams,
  ScheduleParams,
  ScheduleUpdate,
} from "@/types/central/schedule";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const scheduleQueryKeys = createQueryKeys("schedules");
export const activeSchedulesKey = "schedules";

export const useSchedules = (params?: ScheduleParams) => {
  return useQuery({
    queryKey: scheduleQueryKeys.list(params || {}),
    queryFn: () => scheduleService.getSchedules(params),
  });
};

export const useSchedule = (id?: string) => {
  return useQuery({
    queryKey: scheduleQueryKeys.detail(id || ""),
    queryFn: () => scheduleService.getSchedule(id!),
    enabled: !!id,
  });
};

export const useCreateSchedule = () => {
  return useMutation({
    mutationFn: (schedule: ScheduleCreate) =>
      scheduleService.createSchedule(schedule),
    onSuccess: () => {
      toast.success("Schedule created successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create schedule");
    },
  });
};

export const useUpdateSchedule = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScheduleUpdate }) =>
      scheduleService.updateSchedule(id, data),
    onSuccess: () => {
      toast.success("Schedule updated successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update schedule");
    },
  });
};

export const useDeleteSchedule = () => {
  return useMutation({
    mutationFn: (id: string) => scheduleService.deleteSchedule(id),
    onSuccess: () => {
      toast.success("Schedule deleted successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete schedule");
    },
  });
};

export const useActiveSchedules = (
  search?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [activeSchedulesKey, "active", { search }],
    queryFn: () => scheduleService.getActiveSchedules(search),

    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 30,
    enabled: enabled,
  });
};

export const useExportSchedules = () => {
  return useMutation({
    mutationFn: (params: ScheduleExportParams) =>
      scheduleService.exportSchedules(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `schedules_${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to export schedules");
    },
  });
};

export const useImportSchedules = () => {
  return useMutation({
    mutationFn: (file: File) => scheduleService.importSchedules(file),
    onSuccess: (data) => {
      toast.success(
        `Successfully imported ${data.importedCount} schedules, updated ${data.updatedCount} schedules`
      );
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to import schedules");
    },
  });
};

export const useActiveScheduleTree = (enabled: boolean = true) => {
  return useQuery({
    queryKey: [activeSchedulesKey, "tree", "active"],
    queryFn: () => scheduleService.getActiveScheduleTree(),

    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour

    enabled: enabled,
  });
};

export const useExportActiveScheduleTreeToPdf = () => {
  return useMutation({
    mutationFn: () => scheduleService.exportActiveScheduleTreeToPdf(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      link.download = `schedule_tree_${timestamp}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to export schedule tree to PDF");
    },
  });
};

export const useExportActiveScheduleTreeToExcel = () => {
  return useMutation({
    mutationFn: () => scheduleService.exportActiveScheduleTreeToExcel(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      link.download = `schedule_tree_${timestamp}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to export schedule tree to Excel");
    },
  });
};
