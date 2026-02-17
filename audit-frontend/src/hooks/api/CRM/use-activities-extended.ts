import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { activityExtendedService } from "@/services/CRM/activity-extended.service";
import type {
  ActivityFilterParams,
  CreateActivityDto,
  UpdateActivityDto,
  ActivityStatusChangeDto,
  ActivityAssignDto,
} from "@/types/CRM/activity";

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
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-entity-activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-upcoming-activities"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-activities"] });
      toast.success("Activity created successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.message || "Failed to create activity"
      );
    },
  });
};

export const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateActivityDto }) =>
      activityExtendedService.updateActivity(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-entity-activities"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-activities"] });
      toast.success("Activity updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.message || "Failed to update activity"
      );
    },
  });
};

export const useDeleteActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activityExtendedService.deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-entity-activities"] });
      toast.success("Activity deleted successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.message || "Failed to delete activity"
      );
    },
  });
};

export const useChangeActivityStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ActivityStatusChangeDto }) =>
      activityExtendedService.changeStatus(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-entity-activities"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-activities"] });
      toast.success("Activity status updated");
    },
    onError: (error: any) => {
      toast.error(
        error?.message || "Failed to update activity status"
      );
    },
  });
};

export const useAssignActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ActivityAssignDto }) =>
      activityExtendedService.assignActivity(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-activities"] });
      toast.success("Activity assigned successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.message || "Failed to assign activity"
      );
    },
  });
};

export const useBulkAssignActivities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, userId }: { ids: string[]; userId: string }) =>
      activityExtendedService.bulkAssign(ids, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Activities assigned successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.message || "Failed to assign activities"
      );
    },
  });
};

export const useBulkDeleteActivities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      activityExtendedService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Activities deleted successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.message || "Failed to delete activities"
      );
    },
  });
};
