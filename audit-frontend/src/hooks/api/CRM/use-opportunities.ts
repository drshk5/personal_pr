import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { opportunityService } from "@/services/CRM/opportunity.service";
import { accountQueryKeys } from "./use-accounts";
import type {
  CreateOpportunityDto,
  UpdateOpportunityDto,
  OpportunityFilterParams,
  OpportunityBulkArchiveDto,
  CloseOpportunityDto,
  MoveStageDto,
  AddOpportunityContactDto,
} from "@/types/CRM/opportunity";

export const opportunityQueryKeys = createQueryKeys("crm-opportunities");
const boardKeys = createQueryKeys("crm-opportunity-board");

// ── Core CRUD ──────────────────────────────────────────────────

export const useOpportunities = (params?: OpportunityFilterParams) => {
  return useQuery({
    queryKey: opportunityQueryKeys.list(params || {}),
    queryFn: () => opportunityService.getOpportunities(params),
  });
};

export const useOpportunity = (id?: string) => {
  return useQuery({
    queryKey: opportunityQueryKeys.detail(id || ""),
    queryFn: () => opportunityService.getOpportunity(id!),
    enabled: !!id,
    // Always fetch fresh data on mount — stage/status can change via pipeline moves
    refetchOnMount: "always",
    staleTime: 0,
  });
};

export const useCreateOpportunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateOpportunityDto) =>
      opportunityService.createOpportunity(dto),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: opportunityQueryKeys.all,
        }),
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.all }),
      ]);
      toast.success("Opportunity created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create opportunity"),
  });
};

export const useUpdateOpportunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOpportunityDto }) =>
      opportunityService.updateOpportunity(id, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: opportunityQueryKeys.all,
        }),
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.all }),
      ]);
      toast.success("Opportunity updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update opportunity"),
  });
};

export const useDeleteOpportunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      opportunityService.deleteOpportunity(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: opportunityQueryKeys.all,
        }),
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.all }),
      ]);
      toast.success("Opportunity deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete opportunity"),
  });
};

// ── Stage Management ────────────────────────────────────────────

export const useMoveStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveStageDto }) =>
      opportunityService.moveStage(id, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: opportunityQueryKeys.all,
        }),
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.all }),
      ]);
      toast.success("Stage updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update stage"),
  });
};

export const useCloseOpportunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CloseOpportunityDto }) =>
      opportunityService.closeOpportunity(id, data),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: opportunityQueryKeys.all,
        }),
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.all }),
      ]);
      toast.success(
        `Opportunity closed as ${variables.data.strStatus}`
      );
    },
    onError: (error) =>
      handleMutationError(error, "Failed to close opportunity"),
  });
};

// ── Contact Management ────────────────────────────────────────

export const useAddOpportunityContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      opportunityId,
      data,
    }: {
      opportunityId: string;
      data: AddOpportunityContactDto;
    }) => opportunityService.addContact(opportunityId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: opportunityQueryKeys.all,
      });
      toast.success("Contact added to opportunity");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to add contact"),
  });
};

export const useRemoveOpportunityContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      opportunityId,
      contactId,
    }: {
      opportunityId: string;
      contactId: string;
    }) => opportunityService.removeContact(opportunityId, contactId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: opportunityQueryKeys.all,
      });
      toast.success("Contact removed from opportunity");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to remove contact"),
  });
};

// ── Board / Kanban View ─────────────────────────────────────────

export const useOpportunityBoard = (pipelineId?: string) => {
  return useQuery({
    queryKey: boardKeys.detail(pipelineId || ""),
    queryFn: () => opportunityService.getBoard(pipelineId!),
    enabled: !!pipelineId,
  });
};

// ── Bulk Operations ────────────────────────────────────────────

export const useBulkArchiveOpportunities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: OpportunityBulkArchiveDto) =>
      opportunityService.bulkArchive(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: opportunityQueryKeys.all,
      });
      await queryClient.invalidateQueries({ queryKey: boardKeys.all });
      toast.success("Opportunities archived successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to archive opportunities"),
  });
};

export const useBulkRestoreOpportunities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: OpportunityBulkArchiveDto) =>
      opportunityService.bulkRestore(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: opportunityQueryKeys.all,
      });
      await queryClient.invalidateQueries({ queryKey: boardKeys.all });
      toast.success("Opportunities restored successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to restore opportunities"),
  });
};
