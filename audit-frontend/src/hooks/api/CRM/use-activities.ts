import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { activityService } from "@/services/CRM/activity.service";
import { leadQueryKeys } from "./use-leads";
import type {
  CreateActivityDto,
  ActivityFilterParams,
} from "@/types/CRM/activity";

export const activityQueryKeys = createQueryKeys("crm-activities");

const entityActivityKeys = {
  all: ["crm-entity-activities"] as const,
  entity: (entityType: string, entityId: string) =>
    [...entityActivityKeys.all, entityType, entityId] as const,
};

const upcomingKeys = ["crm-upcoming-activities"] as const;

// ── Paginated List ──────────────────────────────────────────────

export const useActivities = (params?: ActivityFilterParams) => {
  return useQuery({
    queryKey: activityQueryKeys.list(params || {}),
    queryFn: () => activityService.getActivities(params),
  });
};

// ── Single Activity ─────────────────────────────────────────────

export const useActivity = (id?: string) => {
  return useQuery({
    queryKey: activityQueryKeys.detail(id || ""),
    queryFn: () => activityService.getActivity(id!),
    enabled: !!id,
  });
};

// ── Create Activity (Immutable — no update/delete) ──────────────

export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateActivityDto) =>
      activityService.createActivity(dto),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: activityQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: entityActivityKeys.all }),
        queryClient.invalidateQueries({ queryKey: upcomingKeys }),
        // Activity creation/completion can auto-change lead status, so refresh lead data
        queryClient.invalidateQueries({ queryKey: leadQueryKeys.all }),
      ]);
      toast.success("Activity logged successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create activity"),
  });
};

// ── Entity-Scoped Activities ────────────────────────────────────

export const useEntityActivities = (
  entityType: string,
  entityId: string,
  params?: ActivityFilterParams
) => {
  return useQuery({
    queryKey: [
      ...entityActivityKeys.entity(entityType, entityId),
      params || {},
    ],
    queryFn: () =>
      activityService.getEntityActivities(entityType, entityId, params),
    enabled: !!entityType && !!entityId,
  });
};

// ── Upcoming Scheduled Activities ───────────────────────────────

export const useUpcomingActivities = () => {
  return useQuery({
    queryKey: upcomingKeys,
    queryFn: () => activityService.getUpcoming(),
  });
};

// ── Bulk Notify Activities ──────────────────────────────────────

export const useBulkNotifyActivities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      activityGuids: string[];
      message: string;
      notifyAssignedUsers: boolean;
    }) => activityService.bulkNotify(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: activityQueryKeys.all });
      toast.success("Bulk notification sent successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to send bulk notifications"),
  });
};
