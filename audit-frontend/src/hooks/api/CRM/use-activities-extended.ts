import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { activityExtendedService } from "@/services/CRM/activity-extended.service";
import type {
  ActivityFilterParams,
  CreateActivityDto,
  UpdateActivityDto,
  ActivityStatusChangeDto,
  ActivityAssignDto,
} from "@/types/CRM/activity";

/** Invalidate every activity-related query so all tabs/views refresh.
 *  Also invalidates lead queries because activity completion auto-changes lead status
 *  (New → Contacted, Contacted → Qualified). */
function invalidateAllActivityQueries(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["activities"] });
  qc.invalidateQueries({ queryKey: ["activity"] });
  qc.invalidateQueries({ queryKey: ["my-activities"] });
  qc.invalidateQueries({ queryKey: ["activities-today"] });
  qc.invalidateQueries({ queryKey: ["overdue-activities"] });
  qc.invalidateQueries({ queryKey: ["upcoming-activities"] });
  qc.invalidateQueries({ queryKey: ["crm-activities"] });
  qc.invalidateQueries({ queryKey: ["crm-entity-activities"] });
  qc.invalidateQueries({ queryKey: ["crm-upcoming-activities"] });
  // Lead/contact data may change when activity status changes
  qc.invalidateQueries({ queryKey: ["crm-leads"] });
  qc.invalidateQueries({ queryKey: ["crm-contacts"] });
}

export const useActivitiesExtended = (params?: ActivityFilterParams) => {
  return useQuery({
    queryKey: ["activities", params],
    queryFn: () => activityExtendedService.getActivities(params),
    staleTime: 30000,
  });
};

export const useActivityDetail = (id?: string) => {
  return useQuery({
    queryKey: ["activity", id],
    queryFn: () => activityExtendedService.getActivity(id!),
    enabled: !!id,
    staleTime: 30000,
  });
};

export const useTodayActivities = () => {
  return useQuery({
    queryKey: ["activities-today"],
    queryFn: () => activityExtendedService.getTodayActivities(),
    staleTime: 60000,
  });
};

export const useMyActivities = (params?: ActivityFilterParams) => {
  return useQuery({
    queryKey: ["my-activities", params],
    queryFn: () => activityExtendedService.getMyActivities(params),
    staleTime: 30000,
  });
};

export const useOverdueActivities = (params?: ActivityFilterParams) => {
  return useQuery({
    queryKey: ["overdue-activities", params],
    queryFn: () => activityExtendedService.getOverdueActivities(params),
    staleTime: 30000,
  });
};

export const useUpcomingActivities = () => {
  return useQuery({
    queryKey: ["upcoming-activities"],
    queryFn: () => activityExtendedService.getUpcoming(),
    staleTime: 60000,
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateActivityDto) =>
      activityExtendedService.createActivity(dto),
    onSuccess: () => {
      invalidateAllActivityQueries(queryClient);
      toast.success("Activity created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to create activity");
    },
  });
};

export const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateActivityDto }) =>
      activityExtendedService.updateActivity(id, dto),
    onSuccess: () => {
      invalidateAllActivityQueries(queryClient);
      toast.success("Activity updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to update activity");
    },
  });
};

export const useDeleteActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activityExtendedService.deleteActivity(id),
    onSuccess: () => {
      invalidateAllActivityQueries(queryClient);
      toast.success("Activity deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to delete activity");
    },
  });
};

export const useChangeActivityStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ActivityStatusChangeDto }) =>
      activityExtendedService.changeStatus(id, dto),
    onSuccess: (_data, variables) => {
      invalidateAllActivityQueries(queryClient);
      const statusLabel = variables.dto.strStatus === "InProgress" ? "In Progress" : variables.dto.strStatus;
      toast.success(`Activity marked as ${statusLabel}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to update activity status");
    },
  });
};

export const useAssignActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ActivityAssignDto }) =>
      activityExtendedService.assignActivity(id, dto),
    onSuccess: () => {
      invalidateAllActivityQueries(queryClient);
      toast.success("Activity assigned successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to assign activity");
    },
  });
};

export const useBulkAssignActivities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, userId }: { ids: string[]; userId: string }) =>
      activityExtendedService.bulkAssign(ids, userId),
    onSuccess: (_data, variables) => {
      invalidateAllActivityQueries(queryClient);
      toast.success(`${variables.ids.length} activities assigned successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to assign activities");
    },
  });
};

export const useBulkDeleteActivities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      activityExtendedService.bulkDelete(ids),
    onSuccess: (_data, variables) => {
      invalidateAllActivityQueries(queryClient);
      toast.success(`${variables.length} activities deleted successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to delete activities");
    },
  });
};
