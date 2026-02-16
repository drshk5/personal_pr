import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupModuleService } from "@/services/central/group-module.service";
import type {
  GroupModuleCreate,
  GroupModuleParams,
  GroupModuleUpdate,
} from "@/types/central/group-module";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

const groupModuleQueryKeys = createQueryKeys("groupModules");

const modulesByGroupKey = (groupId: string) => [
  ...groupModuleQueryKeys.all,
  "modulesByGroup",
  groupId,
];

export const useGroupModules = (params: GroupModuleParams) => {
  const hasValidGroupId = !!(
    params.strGroupGUID && params.strGroupGUID.trim().length > 0
  );

  return useQuery({
    queryKey: groupModuleQueryKeys.list(params),
    queryFn: () => groupModuleService.getGroupModules(params),
    enabled: hasValidGroupId,
  });
};

export const useGroupModule = (id?: string) => {
  return useQuery({
    queryKey: groupModuleQueryKeys.detail(id || ""),
    queryFn: () => groupModuleService.getGroupModule(id!),
    enabled: !!id,
  });
};

export const useCreateGroupModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupModule: GroupModuleCreate) =>
      groupModuleService.createGroupModule(groupModule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupModuleQueryKeys.lists() });
      toast.success("Group module created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create group module"),
  });
};

export const useUpdateGroupModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GroupModuleUpdate }) =>
      groupModuleService.updateGroupModule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupModuleQueryKeys.lists() });
      toast.success("Group module updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update group module"),
  });
};

export const useDeleteGroupModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => groupModuleService.deleteGroupModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupModuleQueryKeys.lists() });
      toast.success("Group module deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete group module"),
  });
};

export const useModulesByGroup = (groupId?: string) => {
  return useQuery({
    queryKey: modulesByGroupKey(groupId || ""),
    queryFn: async () => {
      if (!groupId) return [];
      return groupModuleService.getModulesByGroup(groupId);
    },
    enabled: !!groupId,
  });
};
