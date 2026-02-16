import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { folderService } from "@/services/central/folder.service";
import type { FolderCreate, SimpleFolderUpdate } from "@/types";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const folderQueryKeys = createQueryKeys("folders");

export const useFolders = (search?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: folderQueryKeys.list({ search }),
    queryFn: () => folderService.getFolders(search),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled,
  });
};

export const useFolder = (id?: string) => {
  return useQuery({
    queryKey: folderQueryKeys.detail(id || ""),
    queryFn: () => folderService.getFolder(id!),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!id,
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folder: FolderCreate) => folderService.createFolder(folder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryKeys.lists() });
      toast.success("Folder created successfully");
    },
    onError: (error) => {
      handleMutationError(error, "Failed to create folder");
    },
  });
};

export const useUpdateFolder = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      payload: SimpleFolderUpdate | { id: string; data: SimpleFolderUpdate }
    ) => {
      if ("id" in payload && "data" in payload) {
        return folderService.updateFolder(payload.id, payload.data);
      } else {
        return folderService.updateFolder(id!, payload as SimpleFolderUpdate);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryKeys.lists() });
      toast.success("Folder updated successfully");
    },
    onError: (error) => {
      handleMutationError(error, "Failed to update folder");
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => folderService.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryKeys.lists() });
      toast.success("Folder deleted successfully");
    },
    onError: (error) => {
      handleMutationError(error, "Failed to delete folder");
    },
  });
};
