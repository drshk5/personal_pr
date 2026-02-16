import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type { TagCreate, TagParams, TagUpdate } from "@/types/task/tag";
import { tagService } from "@/services/task/tag.service";

export const tagQueryKeys = createQueryKeys("tags");

export const useTags = (
  params?: TagParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: tagQueryKeys.list(params || {}),
    queryFn: async () => {
      const response = await tagService.getTags(params);
      return response.data || [];
    },
    enabled:
      options?.enabled !== undefined
        ? options.enabled && !!params?.strBoardGUID
        : !!params?.strBoardGUID,
  });
};

export const useTag = (id?: string) => {
  return useQuery({
    queryKey: tagQueryKeys.detail(id || ""),
    queryFn: () => tagService.getTag(id!),
    enabled: !!id,
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tag: TagCreate) => tagService.createTag(tag),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.all });
      toast.success("Tag created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create tag"),
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TagUpdate }) =>
      tagService.updateTag(id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.all });
      toast.success("Tag updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update tag"),
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => tagService.deleteTag(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.all });
      toast.success("Tag deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete tag"),
  });
};
