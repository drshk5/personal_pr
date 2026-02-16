import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addressTypeService } from "@/services/central/address-type.service";
import type { BaseListParams } from "@/types/common";
import type {
  AddressTypeCreate,
  AddressTypeUpdate,
  AddressTypeExportParams,
} from "@/types/central/address-type";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const addressTypeQueryKeys = createQueryKeys("addressTypes");
export const activeAddressTypesKey = "addressTypes";

export const useAddressTypes = (params?: BaseListParams) => {
  return useQuery({
    queryKey: addressTypeQueryKeys.list(params || {}),
    queryFn: () => addressTypeService.getAddressTypes(params),
  });
};

export const useAddressType = (id?: string) => {
  return useQuery({
    queryKey: addressTypeQueryKeys.detail(id || ""),
    queryFn: () => addressTypeService.getAddressType(id!),
    enabled: !!id,
  });
};

export const useCreateAddressType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressType: AddressTypeCreate) =>
      addressTypeService.createAddressType(addressType),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: addressTypeQueryKeys.lists() });
      queryClient.removeQueries({
        queryKey: [...addressTypeQueryKeys.all, "active"],
      });
      toast.success("Address type created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create address type"),
  });
};

export const useUpdateAddressType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressTypeUpdate }) =>
      addressTypeService.updateAddressType(id, data),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: addressTypeQueryKeys.lists() });
      queryClient.removeQueries({
        queryKey: [...addressTypeQueryKeys.all, "active"],
      });
      toast.success("Address type updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update address type"),
  });
};

export const useDeleteAddressType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressTypeService.deleteAddressType(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: addressTypeQueryKeys.lists() });
      queryClient.removeQueries({
        queryKey: [...addressTypeQueryKeys.all, "active"],
      });
      toast.success("Address type deleted successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete address type");
    },
  });
};

export const useActiveAddressTypes = (search?: string) => {
  return useQuery({
    queryKey: search
      ? [activeAddressTypesKey, "active", search]
      : [activeAddressTypesKey, "active"],
    queryFn: () => addressTypeService.getActiveAddressTypes(search),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useExportAddressTypes = () => {
  return useMutation({
    mutationFn: (params: AddressTypeExportParams) =>
      addressTypeService.exportAddressTypes(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `address_types_${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Address types exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to export address types");
    },
  });
};
