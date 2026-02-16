import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { journalVoucherService } from "@/services/Account/journal-voucher.service";
import type {
  JournalVoucherParams,
  JournalVoucherCreate,
  JournalVoucherUpdate,
  JournalVoucherDropdownParams,
  ChangeStatusRequest,
  PendingApprovalParams,
  BulkChangeStatusRequest,
} from "@/types/Account/journal-voucher";
import { toast } from "sonner";
import { handleMutationError } from "../common";

const JOURNAL_VOUCHERS_KEY = "journal-vouchers";
const JOURNAL_VOUCHER_DOCUMENTS_KEY = "journal-voucher-documents";

export const useJournalVouchers = (params: JournalVoucherParams = {}) => {
  return useQuery({
    queryKey: [JOURNAL_VOUCHERS_KEY, params],
    queryFn: () => journalVoucherService.getJournalVouchers(params),
  });
};

export const usePendingApprovalJournalVouchers = (
  params: PendingApprovalParams = {}
) => {
  return useQuery({
    queryKey: ["pending-approval-journal-vouchers", params],
    queryFn: () => journalVoucherService.getPendingApproval(params),
  });
};

export const useJournalVoucher = (journalVoucherGuid: string) => {
  return useQuery({
    queryKey: [JOURNAL_VOUCHERS_KEY, journalVoucherGuid],
    queryFn: () => journalVoucherService.getJournalVoucher(journalVoucherGuid),
    enabled: !!journalVoucherGuid,
  });
};

export const useJournalVouchersDropdown = (
  params?: JournalVoucherDropdownParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["journal-vouchers-dropdown", params],
    queryFn: () => journalVoucherService.getJournalVouchersDropdown(params),
    enabled: options?.enabled,
  });
};

export const useCreateJournalVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      journalVoucher,
      files,
    }: {
      journalVoucher: JournalVoucherCreate;
      files?: File[];
    }) => {
      return journalVoucherService.createJournalVoucher(journalVoucher, files);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOURNAL_VOUCHERS_KEY] });
      queryClient.invalidateQueries({ 
        queryKey: ["journal-voucher-recurring-profiles"] 
      });
      toast.success("Journal voucher created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create journal voucher"),
  });
};

export const useUpdateJournalVoucher = (journalVoucherGuid?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      journalVoucher,
      files,
      removeDocumentIds,
    }: {
      journalVoucher: JournalVoucherUpdate;
      files?: File[];
      removeDocumentIds?: string[];
    }) => {
      if (!journalVoucherGuid) {
        throw new Error("Journal voucher GUID is required");
      }
      return journalVoucherService.updateJournalVoucher(
        journalVoucherGuid,
        journalVoucher,
        files,
        removeDocumentIds
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOURNAL_VOUCHERS_KEY] });
      if (journalVoucherGuid) {
        queryClient.invalidateQueries({ 
          queryKey: [JOURNAL_VOUCHERS_KEY, journalVoucherGuid] 
        });
      }
      queryClient.invalidateQueries({ 
        queryKey: ["journal-voucher-recurring-profiles"] 
      });
      toast.success("Journal voucher updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update journal voucher"),
  });
};

export const useDeleteJournalVoucher = () => {
  return useMutation({
    mutationFn: (journalVoucherGuid: string) => {
      return journalVoucherService.deleteJournalVoucher(journalVoucherGuid);
    },
    onSuccess: () => {
      toast.success("Journal voucher deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete journal voucher"),
  });
};

export const useJournalVoucherDocuments = (journalVoucherGuid?: string) => {
  return useQuery({
    queryKey: [JOURNAL_VOUCHER_DOCUMENTS_KEY, journalVoucherGuid],
    queryFn: async () => {
      if (!journalVoucherGuid) return null;
      const voucher =
        await journalVoucherService.getJournalVoucher(journalVoucherGuid);
      return voucher.strFiles || [];
    },
    enabled: !!journalVoucherGuid,
  });
};

export const useChangeJournalVoucherStatus = (journalVoucherGuid?: string) => {
  return useMutation({
    mutationFn: (request: ChangeStatusRequest) => {
      if (!journalVoucherGuid) {
        throw new Error("Journal voucher GUID is required");
      }
      // Use bulk endpoint with single ID
      return journalVoucherService.bulkChangeStatus({
        strJournal_VoucherGUIDs: [journalVoucherGuid],
        strStatus: request.strStatus,
        strRejectedReason: request.strRejectedReason,
      });
    },
    onSuccess: () => {
      toast.success("Journal voucher status changed successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to change journal voucher status"),
  });
};

export const useBulkChangeJournalVoucherStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BulkChangeStatusRequest) => {
      return journalVoucherService.bulkChangeStatus(request);
    },
    onSuccess: () => {
      toast.success("Journal voucher status changed successfully");
      queryClient.invalidateQueries({
        queryKey: ["pending-approval-journal-vouchers"],
      });
    },
    onError: (error) =>
      handleMutationError(error, "Failed to change journal voucher status"),
  });
};
