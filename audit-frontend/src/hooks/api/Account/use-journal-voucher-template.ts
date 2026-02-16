import { useQuery, useMutation } from "@tanstack/react-query";
import { journalVoucherTemplateService } from "@/services/Account/journal-voucher-template.service";
import type {
  JournalVoucherTemplateParams,
  JournalVoucherTemplateCreate,
  JournalVoucherTemplateUpdate,
  JournalVoucherTemplateDropdownParams,
} from "@/types/Account/journal-voucher-template";

import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

const journalVoucherTemplateQueryKeys = createQueryKeys(
  "journal-voucher-templates"
);

export const useJournalVoucherTemplates = (
  params: JournalVoucherTemplateParams = {}
) => {
  return useQuery({
    queryKey: journalVoucherTemplateQueryKeys.list(params),
    queryFn: () =>
      journalVoucherTemplateService.getJournalVoucherTemplates(params),
  });
};

export const useJournalVoucherTemplate = (
  journalVoucherTemplateGuid: string
) => {
  return useQuery({
    queryKey: journalVoucherTemplateQueryKeys.detail(
      journalVoucherTemplateGuid
    ),
    queryFn: () =>
      journalVoucherTemplateService.getJournalVoucherTemplate(
        journalVoucherTemplateGuid
      ),
    enabled: !!journalVoucherTemplateGuid,
  });
};

export const useJournalVoucherTemplatesDropdown = (
  params?: JournalVoucherTemplateDropdownParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [...journalVoucherTemplateQueryKeys.all, "dropdown", params],
    queryFn: () =>
      journalVoucherTemplateService.getJournalVoucherTemplatesDropdown(params),
    enabled: options?.enabled,
  });
};

export const useCreateJournalVoucherTemplate = () => {
  return useMutation({
    mutationFn: (journalVoucherTemplate: JournalVoucherTemplateCreate) => {
      return journalVoucherTemplateService.createJournalVoucherTemplate(
        journalVoucherTemplate
      );
    },
    onSuccess: () => {
      toast.success("Journal voucher template created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create journal voucher template"),
  });
};

export const useUpdateJournalVoucherTemplate = (
  journalVoucherTemplateGuid?: string
) => {
  return useMutation({
    mutationFn: (journalVoucherTemplate: JournalVoucherTemplateUpdate) => {
      if (!journalVoucherTemplateGuid) {
        throw new Error("Journal voucher template GUID is required");
      }
      return journalVoucherTemplateService.updateJournalVoucherTemplate(
        journalVoucherTemplateGuid,
        journalVoucherTemplate
      );
    },
    onSuccess: () => {
      toast.success("Journal voucher template updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update journal voucher template"),
  });
};

export const useDeleteJournalVoucherTemplate = () => {
  return useMutation({
    mutationFn: (journalVoucherTemplateGuid: string) => {
      return journalVoucherTemplateService.deleteJournalVoucherTemplate(
        journalVoucherTemplateGuid
      );
    },
    onSuccess: () => {
      toast.success("Journal voucher template deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete journal voucher template"),
  });
};
