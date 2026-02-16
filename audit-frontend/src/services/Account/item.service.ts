import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Item,
  ItemCreate,
  ItemListResponse,
  ItemParams,
  ItemSalesData,
  ItemPurchaseData,
  ItemSimple,
  ItemUpdate,
  ItemActiveByType,
} from "@/types/Account/item";

export const itemService = {
  getItems: async (params: ItemParams = {}): Promise<ItemListResponse> => {
    return await ApiService.getWithMeta<ItemListResponse>(
      `${ACCOUNT_API_PREFIX}/Item`,
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getItem: async (id: string): Promise<Item> => {
    return await ApiService.get<Item>(`${ACCOUNT_API_PREFIX}/Item/${id}`);
  },

  getActiveItems: async (): Promise<Item[]> => {
    return await ApiService.get<Item[]>(`${ACCOUNT_API_PREFIX}/Item/active`);
  },

  getItemSalesData: async (itemId: string): Promise<ItemSalesData> => {
    return await ApiService.get<ItemSalesData>(
      `${ACCOUNT_API_PREFIX}/Item/sales-data/${itemId}`
    );
  },

  getItemPurchaseData: async (itemId: string): Promise<ItemPurchaseData> => {
    return await ApiService.get<ItemPurchaseData>(
      `${ACCOUNT_API_PREFIX}/Item/purchase-data/${itemId}`
    );
  },

  getActiveByType: async (type: string): Promise<ItemActiveByType[]> => {
    return await ApiService.get<ItemActiveByType[]>(
      `${ACCOUNT_API_PREFIX}/Item/active-by-type`,
      { type }
    );
  },

  createItem: async (item: ItemCreate, files?: File[]): Promise<ItemSimple> => {
    const formData = new FormData();
    formData.append("itemData", JSON.stringify(item));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    return await api
      .post(`${ACCOUNT_API_PREFIX}/Item`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data.data);
  },

  updateItem: async (
    id: string,
    item: ItemUpdate,
    files?: File[],
    removeDocumentIds?: string[]
  ): Promise<ItemSimple> => {
    const formData = new FormData();
    formData.append("itemData", JSON.stringify(item));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    if (removeDocumentIds && removeDocumentIds.length > 0) {
      // Backend expects Guid[] array named strRemoveDocumentAssociationGUIDs
      removeDocumentIds.forEach((guid) =>
        formData.append("strRemoveDocumentAssociationGUIDs", guid)
      );
    }

    return await api
      .put(`${ACCOUNT_API_PREFIX}/Item/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data.data);
  },

  deleteItem: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${ACCOUNT_API_PREFIX}/Item/${id}`);
    return true;
  },
};
