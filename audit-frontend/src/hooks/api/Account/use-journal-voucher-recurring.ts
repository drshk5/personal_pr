import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { journalVoucherRecurringProfileService } from "@/services/Account/journal-voucher-recurring.service";
import type {
  JournalVoucherRecurringProfileParams,
  JournalVoucherRecurringProfileCreate,
  JournalVoucherRecurringProfileUpdate,
} from "@/types/Account/journal-voucher-recurring";
import { toast } from "sonner";
import { handleMutationError } from "../common";

const JOURNAL_VOUCHER_RECURRING_PROFILES_KEY =
  "journal-voucher-recurring-profiles";

export const useJournalVoucherRecurringProfiles = (
  params: JournalVoucherRecurringProfileParams = {}
) => {
  return useQuery({
    queryKey: [JOURNAL_VOUCHER_RECURRING_PROFILES_KEY, params],
    queryFn: () =>
      journalVoucherRecurringProfileService.getAll(params),
  });
};

export const useJournalVoucherRecurringProfile = (profileId: string) => {
  return useQuery({
    queryKey: [JOURNAL_VOUCHER_RECURRING_PROFILES_KEY, profileId],
    queryFn: () =>
      journalVoucherRecurringProfileService.getById(profileId),
    enabled: !!profileId,
  });
};

export const useCreateJournalVoucherRecurringProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: JournalVoucherRecurringProfileCreate) => {
      return journalVoucherRecurringProfileService.create(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [JOURNAL_VOUCHER_RECURRING_PROFILES_KEY],
      });
      toast.success("Recurring profile created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create recurring profile"),
  });
};

export const useUpdateJournalVoucherRecurringProfile = (
  profileId?: string
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: JournalVoucherRecurringProfileUpdate) => {
      if (!profileId) {
        throw new Error("Profile ID is required");
      }
      return journalVoucherRecurringProfileService.update(profileId, profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [JOURNAL_VOUCHER_RECURRING_PROFILES_KEY],
      });
      if (profileId) {
        queryClient.invalidateQueries({
          queryKey: [JOURNAL_VOUCHER_RECURRING_PROFILES_KEY, profileId],
        });
      }
      toast.success("Recurring profile updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update recurring profile"),
  });
};

export const useDeleteJournalVoucherRecurringProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) => {
      return journalVoucherRecurringProfileService.delete(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [JOURNAL_VOUCHER_RECURRING_PROFILES_KEY],
      });
      toast.success("Recurring profile deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete recurring profile"),
  });
};
