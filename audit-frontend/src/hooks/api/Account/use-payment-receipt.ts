import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentReceiptService } from "@/services/Account/payment-receipt.service";
import type {
  PaymentReceiptParams,
  PaymentReceiptCreate,
  PaymentReceiptUpdate,
  PaymentReceiptDropdownParams,
  PaymentReceiptChangeStatusRequest,
} from "@/types/Account/payment-receipt";
import { toast } from "sonner";
import { handleMutationError } from "../common";

const PAYMENT_RECEIPTS_KEY = "payment-receipts";

export const usePaymentReceipts = (params: PaymentReceiptParams = {}) => {
  return useQuery({
    queryKey: [PAYMENT_RECEIPTS_KEY, params],
    queryFn: () => paymentReceiptService.getPaymentReceipts(params),
  });
};

export const usePendingApprovalPaymentReceipts = (
  params: PaymentReceiptParams = {},
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["pending-approval-payment-receipts", params],
    queryFn: () =>
      paymentReceiptService.getPendingApprovalPaymentReceipts(params),
    enabled: options?.enabled,
  });
};

export const usePaymentReceipt = (paymentReceiptGuid: string) => {
  return useQuery({
    queryKey: [PAYMENT_RECEIPTS_KEY, paymentReceiptGuid],
    queryFn: () => paymentReceiptService.getPaymentReceipt(paymentReceiptGuid),
    enabled: !!paymentReceiptGuid,
  });
};

export const usePaymentReceiptsDropdown = (
  params?: PaymentReceiptDropdownParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["payment-receipts-dropdown", params],
    queryFn: () => paymentReceiptService.getPaymentReceiptsDropdown(params),
    enabled: options?.enabled,
  });
};

export const useCreatePaymentReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentReceipt,
      files,
    }: {
      paymentReceipt: PaymentReceiptCreate;
      files?: File[];
    }) => {
      return paymentReceiptService.createPaymentReceipt(paymentReceipt, files);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYMENT_RECEIPTS_KEY] });
      toast.success("Payment/Receipt created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create payment/receipt"),
  });
};

export const useUpdatePaymentReceipt = (paymentReceiptGuid?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentReceipt,
      files,
      removeDocumentIds,
    }: {
      paymentReceipt: PaymentReceiptUpdate;
      files?: File[];
      removeDocumentIds?: string[];
    }) => {
      if (!paymentReceiptGuid) {
        throw new Error("Payment/Receipt GUID is required");
      }
      return paymentReceiptService.updatePaymentReceipt(
        paymentReceiptGuid,
        paymentReceipt,
        files,
        removeDocumentIds
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYMENT_RECEIPTS_KEY] });
      if (paymentReceiptGuid) {
        queryClient.invalidateQueries({
          queryKey: [PAYMENT_RECEIPTS_KEY, paymentReceiptGuid],
        });
      }
      toast.success("Payment/Receipt updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update payment/receipt"),
  });
};

export const useDeletePaymentReceipt = () => {
  return useMutation({
    mutationFn: (paymentReceiptGuid: string) => {
      return paymentReceiptService.deletePaymentReceipt(paymentReceiptGuid);
    },
    onSuccess: () => {
      toast.success("Payment/Receipt deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete payment/receipt"),
  });
};

export const useChangePaymentReceiptStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PaymentReceiptChangeStatusRequest) =>
      paymentReceiptService.changeStatus(request),
    onSuccess: () => {
      toast.success("Payment/Receipt status updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["pending-approval-payment-receipts"],
      });
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update payment/receipt status"),
  });
};
