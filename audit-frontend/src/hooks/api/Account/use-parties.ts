import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partyService } from "@/services/Account/party.service";
import type {
  PartyCreate,
  PartyParams,
  PartyTypeActiveParams,
  PartyUpdate,
  UpdateBillingAndShippingAddress,
} from "@/types/Account/party";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const partyQueryKeys = createQueryKeys("parties");

export const useParties = (params?: PartyParams) => {
  return useQuery({
    queryKey: partyQueryKeys.list(params || {}),
    queryFn: () => partyService.getParties(params),
  });
};

export const useParty = (id?: string) => {
  return useQuery({
    queryKey: partyQueryKeys.detail(id || ""),
    queryFn: () => partyService.getParty(id!),
    enabled: !!id,
  });
};

export const usePartyWithLocations = (id?: string) => {
  return useQuery({
    queryKey: [...partyQueryKeys.detail(id || ""), "with-addresses"],
    queryFn: () => partyService.getPartyWithLocations(id!),
    enabled: !!id,
  });
};

export const useCreateParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, files }: { data: PartyCreate; files?: File[] }) =>
      partyService.createParty(data, files),
    onSuccess: async () => {
      toast.success("Party created successfully");
      queryClient.removeQueries({
        queryKey: partyQueryKeys.list({ type: "active" }),
      });
    },
    onError: (error) => handleMutationError(error, "Failed to create party"),
  });
};

export const useUpdateParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
      strRemoveDocumentAssociationGUIDs,
    }: {
      id: string;
      data: PartyUpdate;
      files?: File[];
      strRemoveDocumentAssociationGUIDs?: string[];
    }) =>
      partyService.updateParty(
        id,
        data,
        files,
        strRemoveDocumentAssociationGUIDs
      ),
    onSuccess: async () => {
      toast.success("Party updated successfully");
      queryClient.removeQueries({
        queryKey: partyQueryKeys.list({ type: "active" }),
      });
    },
    onError: (error) => handleMutationError(error, "Failed to update party"),
  });
};

export const useDeleteParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => partyService.deleteParty(id),
    onSuccess: async () => {
      toast.success("Party deleted successfully");
      queryClient.removeQueries({
        queryKey: partyQueryKeys.list({ type: "active" }),
      });
    },
    onError: (error) => handleMutationError(error, "Failed to delete party"),
  });
};

export const useActivePartiesByType = (
  params: PartyTypeActiveParams,
  enabled: boolean = true
) => {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) => value !== undefined && value !== ""
    )
  );
  return useQuery({
    queryKey: partyQueryKeys.list({ type: "active", ...filteredParams }),
    queryFn: () => partyService.getActivePartiesByType(params),
    enabled: enabled && !!params.strPartyType,
    staleTime: 1 * 60 * 60 * 1000, // 1 hour
  });
};

export const useUpdateBillingAndShippingAddress = () => {
  return useMutation({
    mutationFn: ({
      partyGUID,
      data,
    }: {
      partyGUID: string;
      data: UpdateBillingAndShippingAddress;
    }) => partyService.updateBillingAndShippingAddress(partyGUID, data),
    onSuccess: async () => {
      toast.success("Billing and shipping address updated successfully");
    },
    onError: (error) =>
      handleMutationError(
        error,
        "Failed to update billing and shipping address"
      ),
  });
};

export const usePartyDropdown = (
  search?: string,
  partyType?: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [...partyQueryKeys.list({ search, partyType }), "dropdown"],
    queryFn: () => partyService.getDropdown(search, partyType),
    enabled: options?.enabled !== false,
  });
};

export const useCustomerDropdown = (
  search?: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [
      ...partyQueryKeys.list({ search, partyType: "Customer" }),
      "dropdown",
    ],
    queryFn: () => partyService.getCustomerDropdown(search),
    enabled: options?.enabled !== false,
  });
};

export const useVendorDropdown = (
  search?: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [
      ...partyQueryKeys.list({ search, partyType: "Vendor" }),
      "dropdown",
    ],
    queryFn: () => partyService.getVendorDropdown(search),
    enabled: options?.enabled !== false,
  });
};
