import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { moduleService } from "@/services/central/module.service";
import type {
  ModuleCreate,
  ModuleExportParams,
  ModuleUpdate,
} from "@/types/central/module";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { useNavigate } from "react-router-dom";
import type { BaseListParams } from "@/types";
import { clearReactQueryPersistence } from "@/lib/utils/app-state-utils";

export const moduleQueryKeys = createQueryKeys("modules");

export const activeModulesKey = "modules";

export const useModules = (params?: BaseListParams) => {
  return useQuery({
    queryKey: moduleQueryKeys.list(params || {}),
    queryFn: () => moduleService.getModules(params),
  });
};

export const useModule = (id?: string) => {
  return useQuery({
    queryKey: moduleQueryKeys.detail(id || ""),
    queryFn: () => moduleService.getModule(id!),
    enabled: !!id,
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (module: ModuleCreate) => moduleService.createModule(module),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleQueryKeys.all });
      toast.success("Module created successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create module");
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ModuleUpdate }) =>
      moduleService.updateModule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleQueryKeys.all });
      toast.success("Module updated successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update module");
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => moduleService.deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleQueryKeys.all });
      toast.success("Module deleted successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete module");
    },
  });
};

export const useActiveModules = (search?: string) => {
  return useQuery({
    queryKey: [...moduleQueryKeys.all, "active", search],
    queryFn: () => moduleService.getActiveModules(search),
  });
};

export const useExportModules = () => {
  return useMutation({
    mutationFn: (params: ModuleExportParams) =>
      moduleService.exportModules(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `modules_${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Modules exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to export modules");
    },
  });
};

export const useSwitchModule = (autoNavigate: boolean = true) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (moduleGUID: string) => {
      sessionStorage.setItem("moduleSwitch", "true");

      const timestamp = Date.now().toString();
      sessionStorage.setItem("lastContextUpdateTime", timestamp);

      await moduleService.switchModule(moduleGUID);

      return;
    },
    onSuccess: async () => {
      // Clear React Query persisted cache to avoid cross-module leaks
      await clearReactQueryPersistence(queryClient);
      // Invalidate all queries - React Query will automatically refetch them
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-menu-rights"] });
      queryClient.invalidateQueries({ queryKey: ["user-rights"] });
      queryClient.invalidateQueries({ queryKey: ["help-center"] });

      toast.success("Module switched successfully", {
        duration: 3000,
      });

      if (autoNavigate) {
        navigate("/welcome", { replace: true });
      }

      // Clear the switch flag after navigation
      setTimeout(() => {
        sessionStorage.removeItem("moduleSwitch");
      }, 1000);
    },
    onError: (error) => {
      sessionStorage.removeItem("moduleSwitch");

      handleMutationError(error, "Failed to switch module");
    },
  });
};

export const useUserModules = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...moduleQueryKeys.all, "user-modules"],
    queryFn: () => moduleService.getUserModules(),
    ...options,
    refetchOnWindowFocus: false,
  });
};
