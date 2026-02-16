import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partyContactService } from "@/services/Account/party-contact.service";
import type {
  PartyContactCreate,
  PartyContactParams,
  PartyContactUpdate,
} from "@/types/Account/party-contact";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const partyContactQueryKeys = createQueryKeys("party-contacts");

export const usePartyContacts = (
  params?: PartyContactParams & { enabled?: boolean }
) => {
  const { enabled, ...queryParams } = params || {};

  return useQuery({
    queryKey: partyContactQueryKeys.list(queryParams),
    queryFn: () => partyContactService.getPartyContacts(queryParams),
    enabled: enabled ?? true,
  });
};

export const usePartyContact = (id?: string) => {
  return useQuery({
    queryKey: partyContactQueryKeys.detail(id || ""),
    queryFn: () => partyContactService.getPartyContact(id!),
    enabled: !!id,
  });
};

export const useCreatePartyContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (partyContact: PartyContactCreate) =>
      partyContactService.createPartyContact(partyContact),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: partyContactQueryKeys.lists(),
      });
      toast.success("Customer contact created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create customer contact"),
  });
};

export const useUpdatePartyContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PartyContactUpdate }) =>
      partyContactService.updatePartyContact(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: partyContactQueryKeys.lists(),
      });
      toast.success("Customer contact updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update customer contact"),
  });
};

export const useDeletePartyContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      partyContactService.deletePartyContact(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: partyContactQueryKeys.lists(),
      });
      toast.success("Customer contact deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete customer contact"),
  });
};
