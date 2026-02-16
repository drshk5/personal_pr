import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "@/services/Account/vendor.service";
import type {
  VendorCreate,
  VendorParams,
  VendorTypeActiveParams,
  VendorUpdate,
} from "@/types/Account/vendor";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

const vendorQueryKeys = createQueryKeys("vendors");

export const useVendors = (params?: VendorParams) => {
  return useQuery({
    queryKey: vendorQueryKeys.list(params || {}),
    queryFn: () => vendorService.getVendors(params),
  });
};

export const useVendor = (id?: string) => {
  return useQuery({
    queryKey: vendorQueryKeys.detail(id || ""),
    queryFn: () => vendorService.getVendor(id!),
    enabled: !!id,
  });
};

export const useVendorWithAddresses = (id?: string) => {
  return useQuery({
    queryKey: [...vendorQueryKeys.detail(id || ""), "with-addresses"],
    queryFn: () => vendorService.getVendorWithAddresses(id!),
    enabled: !!id,
  });
};

export const useCreateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, files }: { data: VendorCreate; files?: File[] }) =>
      vendorService.createVendor(data, files),
    onSuccess: async () => {
      toast.success("Vendor created successfully");
      queryClient.removeQueries({
        queryKey: vendorQueryKeys.list({ type: "active" }),
      });
    },
    onError: (error) => handleMutationError(error, "Failed to create vendor"),
  });
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
      strRemoveDocumentAssociationGUIDs,
    }: {
      id: string;
      data: VendorUpdate;
      files?: File[];
      strRemoveDocumentAssociationGUIDs?: string[];
    }) =>
      vendorService.updateVendor(
        id,
        data,
        files,
        strRemoveDocumentAssociationGUIDs
      ),
    onSuccess: async () => {
      toast.success("Vendor updated successfully");
      queryClient.removeQueries({
        queryKey: vendorQueryKeys.list({ type: "active" }),
      });
    },
    onError: (error) => handleMutationError(error, "Failed to update vendor"),
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => vendorService.deleteVendor(id),
    onSuccess: async () => {
      toast.success("Vendor deleted successfully");
      queryClient.removeQueries({
        queryKey: vendorQueryKeys.list({ type: "active" }),
      });
    },
    onError: (error) => handleMutationError(error, "Failed to delete vendor"),
  });
};

export const useActiveVendorsByType = (
  params: VendorTypeActiveParams,
  enabled: boolean = true
) => {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) => value !== undefined && value !== ""
    )
  );
  return useQuery({
    queryKey: vendorQueryKeys.list({ type: "active", ...filteredParams }),
    queryFn: () => vendorService.getActiveVendorsByType(params),
    enabled,
    staleTime: 1 * 60 * 60 * 1000,
  });
};

// Note: Document upload and dropdown mirror party endpoints; add when needed.
