import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { activityService } from "@/services/CRM/activity.service";
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
