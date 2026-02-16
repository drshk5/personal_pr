import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { contactService } from "@/services/CRM/contact.service";
import type {
  CreateContactDto,
  UpdateContactDto,
  ContactFilterParams,
  ContactBulkArchiveDto,
} from "@/types/CRM/contact";

export const contactQueryKeys = createQueryKeys("crm-contacts");

// ── Core CRUD ──────────────────────────────────────────────────

export const useContacts = (params?: ContactFilterParams) => {
  return useQuery({
    queryKey: contactQueryKeys.list(params || {}),
    queryFn: () => contactService.getContacts(params),
    staleTime: 30 * 1000, // 30s — avoid refetch on filter/page toggle
    placeholderData: (previousData) => previousData, // keep old data visible while new page loads
  });
};

export const useContact = (id?: string) => {
  return useQuery({
    queryKey: contactQueryKeys.detail(id || ""),
    queryFn: () => contactService.getContact(id!),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 min — detail doesn't change frequently
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateContactDto) => contactService.createContact(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: contactQueryKeys.lists(),
      });
      toast.success("Contact created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create contact"),
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactDto }) =>
      contactService.updateContact(id, data),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: contactQueryKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: contactQueryKeys.detail(variables.id),
        }),
      ]);
      toast.success("Contact updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update contact"),
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => contactService.deleteContact(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: contactQueryKeys.lists(),
      });
      toast.success("Contact deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete contact"),
  });
};

// ── Bulk Operations ────────────────────────────────────────────

export const useBulkArchiveContacts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ContactBulkArchiveDto) =>
      contactService.bulkArchive(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: contactQueryKeys.lists(),
      });
      toast.success("Contacts archived successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to archive contacts"),
  });
};

export const useBulkRestoreContacts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ContactBulkArchiveDto) =>
      contactService.bulkRestore(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: contactQueryKeys.lists(),
      });
      toast.success("Contacts restored successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to restore contacts"),
  });
};
