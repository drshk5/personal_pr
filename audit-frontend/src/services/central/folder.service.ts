import { ApiService } from "@/lib/api/api-service";
import type {
  FolderCreate,
  FolderListResponse,
  FolderResponse,
  SimpleFolderUpdate,
} from "@/types";

export const folderService = {
  createFolder: async (folder: FolderCreate): Promise<FolderResponse> => {
    return await ApiService.post<FolderResponse>("/Folder", folder);
  },

  getFolder: async (id: string): Promise<FolderResponse> => {
    return await ApiService.get<FolderResponse>(`/Folder/${id}`);
  },

  getFolders: async (search: string = ""): Promise<FolderListResponse> => {
    return await ApiService.getWithMeta<FolderListResponse>(
      "/Folder",
      search ? { search } : undefined
    );
  },

  updateFolder: async (
    id: string,
    folder: SimpleFolderUpdate
  ): Promise<FolderResponse> => {
    return await ApiService.put<FolderResponse>(`/Folder/${id}`, folder);
  },

  deleteFolder: async (id: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(`/Folder/${id}`);
  },
};
