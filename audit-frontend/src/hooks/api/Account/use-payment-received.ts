import { paymentReceivedService } from "@/services/Account/payment-received.service";
import type {
  PaymentReceivedFilterParams,
  PaymentReceivedPendingApprovalFilterParams,
  PaymentReceivedFormData,
  PaymentReceivedChangeStatusRequest,
} from "@/types/Account/payment-received";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const paymentReceivedQueryKeys = createQueryKeys("paymentReceived");

export const usePaymentReceived = (params?: PaymentReceivedFilterParams) => {
  return useQuery({
    queryKey: paymentReceivedQueryKeys.list(params || {}),
    queryFn: () => paymentReceivedService.getAll(params),
  });
};

export const usePaymentReceivedById = (id?: string) => {
  return useQuery({
    queryKey: paymentReceivedQueryKeys.detail(id || ""),
    queryFn: () => paymentReceivedService.getById(id!),
    enabled: !!id,
  });
};

export const usePaymentReceivedDropdown = (
  search?: string,
  options?: Omit<UseQueryOptions<unknown>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: [...paymentReceivedQueryKeys.all, "dropdown", search],
    queryFn: () => paymentReceivedService.getDropdown(search),
    ...options,
  });
};

export const usePaymentReceivedPendingApproval = (
  params?: PaymentReceivedPendingApprovalFilterParams
) => {
  return useQuery({
    queryKey: [
      ...paymentReceivedQueryKeys.all,
      "pending-approval",
      params || {},
    ],
    queryFn: () => paymentReceivedService.getPendingApproval(params),
  });
};

export const useCreatePaymentReceived = () => {
  return useMutation({
    mutationFn: (data: PaymentReceivedFormData) =>
      paymentReceivedService.create(data),
    onSuccess: () => {
      toast.success("Payment received created successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create payment received");
    },
  });
};

export const useUpdatePaymentReceived = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentReceivedFormData }) =>
      paymentReceivedService.update(id, data),
    onSuccess: () => {
      toast.success("Payment received updated successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update payment received");
    },
  });
};

export const useDeletePaymentReceived = () => {
  return useMutation({
    mutationFn: (id: string) => paymentReceivedService.delete(id),
    onSuccess: () => {
      toast.success("Payment received deleted successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete payment received");
    },
  });
};

export const useChangePaymentReceivedStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PaymentReceivedChangeStatusRequest) =>
      paymentReceivedService.changeStatus(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...paymentReceivedQueryKeys.all, "pending-approval"],
      });
      toast.success("Payment received status changed successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to change payment received status");
    },
  });
};

export const usePaymentReceivedDocumentTypes = () => {
  return useQuery({
    queryKey: [...paymentReceivedQueryKeys.all, "document-types"],
    queryFn: () => paymentReceivedService.getDocumentTypes(),
    enabled: false,
  });
};

export const usePrintPaymentReceived = (id?: string) => {
  return useQuery({
    queryKey: [...paymentReceivedQueryKeys.all, "print", id],
    queryFn: () => paymentReceivedService.getPrint(id!),
    enabled: !!id,
  });
};
