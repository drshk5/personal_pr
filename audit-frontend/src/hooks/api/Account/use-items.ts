import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  ItemCreate,
  ItemParams,
  ItemUpdate,
  ItemSalesData,
} from "@/types/Account/item";
import { itemService } from "@/services/Account/item.service";

export const itemQueryKeys = createQueryKeys("items");

export const useItems = (params?: ItemParams) => {
  return useQuery({
    queryKey: itemQueryKeys.list(params || {}),
    queryFn: () => itemService.getItems(params),
  });
};

export const useItem = (id?: string) => {
  return useQuery({
    queryKey: itemQueryKeys.detail(id || ""),
    queryFn: () => itemService.getItem(id!),
    enabled: !!id,
  });
};

export const useActiveItems = () => {
  return useQuery({
    queryKey: itemQueryKeys.list({ active: true }),
    queryFn: () => itemService.getActiveItems(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useActiveByType = (
  type?: string,
  options?: Partial<UseQueryOptions>
) => {
  return useQuery({
    queryKey: type
      ? [...itemQueryKeys.all, "activeByType", type]
      : [...itemQueryKeys.all, "activeByType"],
    queryFn: () => itemService.getActiveByType(type!),
    enabled: !!type,
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

export const useItemSalesData = (id?: string) => {
  return useQuery({
    queryKey: [...itemQueryKeys.all, "salesData", id || ""],
    queryFn: () => itemService.getItemSalesData(id!),
    enabled: !!id,
  });
};

export const useItemsSalesData = (ids: string[] = []) => {
  return useQuery({
    queryKey: [...itemQueryKeys.all, "multiSalesData", ids],
    queryFn: async () => {
      const results: Record<string, ItemSalesData> = {};
      for (const id of ids) {
        try {
          const data = await itemService.getItemSalesData(id);
          results[id] = data;
        } catch (error) {
          console.error(`Failed to fetch sales data for item ${id}`, error);
        }
      }
      return results;
    },
    enabled: ids.length > 0,
  });
};

export const useItemPurchaseData = (id?: string) => {
  return useQuery({
    queryKey: [itemQueryKeys, "purchaseData", id || ""],
    queryFn: () => itemService.getItemPurchaseData(id!),
    enabled: !!id,
  });
};

export const useItemsPurchaseData = (ids: string[] = []) => {
  return useQuery({
    queryKey: [...itemQueryKeys.all, "multiPurchaseData", ids],
    queryFn: async () => {
      const results: Record<string, ItemSalesData> = {};
      for (const id of ids) {
        try {
          const data = await itemService.getItemPurchaseData(id);
          results[id] = data;
        } catch (error) {
          console.error(`Failed to fetch purchase data for item ${id}`, error);
        }
      }
      return results;
    },
    enabled: ids.length > 0,
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ item, files }: { item: ItemCreate; files?: File[] }) =>
      itemService.createItem(item, files),
    onSuccess: async () => {
      toast.success("Item created successfully");
      queryClient.removeQueries({
        queryKey: itemQueryKeys.list({ active: true }),
      });
      queryClient.removeQueries({
        queryKey: [...itemQueryKeys.all, "activeByType"],
      });
    },
    onError: (error) => handleMutationError(error, "Failed to create item"),
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
      removeDocumentIds,
    }: {
      id: string;
      data: ItemUpdate;
      files?: File[];
      removeDocumentIds?: string[];
    }) => itemService.updateItem(id, data, files, removeDocumentIds),
    onSuccess: async () => {
      toast.success("Item updated successfully");
      queryClient.removeQueries({
        queryKey: itemQueryKeys.list({ active: true }),
      });
      queryClient.removeQueries({
        queryKey: [...itemQueryKeys.all, "activeByType"],
      });
    },
    onError: (error) => handleMutationError(error, "Failed to update item"),
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => itemService.deleteItem(id),
    onSuccess: async () => {
      toast.success("Item deleted successfully");
      queryClient.removeQueries({
        queryKey: itemQueryKeys.list({ active: true }),
      });
      queryClient.removeQueries({
        queryKey: [...itemQueryKeys.all, "activeByType"],
      });
    },
    onError: (error) => handleMutationError(error, "Failed to delete item"),
  });
};
