import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { pipelineService } from "@/services/CRM/pipeline.service";
import type {
  CreatePipelineDto,
  UpdatePipelineDto,
} from "@/types/CRM/pipeline";

export const pipelineQueryKeys = createQueryKeys("crm-pipelines");

// ── Core CRUD ──────────────────────────────────────────────────

export const usePipelines = () => {
  return useQuery({
    queryKey: pipelineQueryKeys.all,
    queryFn: () => pipelineService.getPipelines(),
  });
};

export const usePipeline = (id?: string) => {
  return useQuery({
    queryKey: pipelineQueryKeys.detail(id || ""),
    queryFn: () => pipelineService.getPipeline(id!),
    enabled: !!id,
  });
};

export const useCreatePipeline = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePipelineDto) =>
      pipelineService.createPipeline(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: pipelineQueryKeys.all,
      });
      toast.success("Pipeline created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create pipeline"),
  });
};

export const useUpdatePipeline = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePipelineDto }) =>
      pipelineService.updatePipeline(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: pipelineQueryKeys.all,
      });
      toast.success("Pipeline updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update pipeline"),
  });
};

export const useDeletePipeline = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      pipelineService.deletePipeline(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: pipelineQueryKeys.all,
      });
      toast.success("Pipeline deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete pipeline"),
  });
};

export const useSetDefaultPipeline = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      pipelineService.setDefaultPipeline(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: pipelineQueryKeys.all,
      });
      toast.success("Default pipeline set successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to set default pipeline"),
  });
};
