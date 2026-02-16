import { paymentMadeService } from "@/services/Account/payment-made.service";
import type {
  PaymentMadeFilterParams,
  PaymentMadePendingApprovalFilterParams,
  PaymentMadeFormData,
  PaymentMadeChangeStatusRequest,
} from "@/types/Account/payment-made";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const paymentMadeQueryKeys = createQueryKeys("paymentMade");

export const usePaymentMade = (params?: PaymentMadeFilterParams) => {
  return useQuery({
    queryKey: paymentMadeQueryKeys.list(params || {}),
    queryFn: () => paymentMadeService.getAll(params),
  });
};

export const usePaymentMadeById = (id?: string) => {
  return useQuery({
    queryKey: paymentMadeQueryKeys.detail(id || ""),
    queryFn: () => paymentMadeService.getById(id!),
    enabled: !!id,
  });
};

export const usePaymentMadeDropdown = (
  search?: string,
  options?: Omit<UseQueryOptions<unknown>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: [...paymentMadeQueryKeys.all, "dropdown", search],
    queryFn: () => paymentMadeService.getDropdown(search),
    ...options,
  });
};

export const usePaymentMadePendingApproval = (
  params?: PaymentMadePendingApprovalFilterParams
) => {
  return useQuery({
    queryKey: [...paymentMadeQueryKeys.all, "pending-approval", params || {}],
    queryFn: () => paymentMadeService.getPendingApproval(params),
  });
};

export const useCreatePaymentMade = () => {
  return useMutation({
    mutationFn: (data: PaymentMadeFormData) => paymentMadeService.create(data),
    onSuccess: () => {
      toast.success("Payment made created successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create payment made");
    },
  });
};

export const useUpdatePaymentMade = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentMadeFormData }) =>
      paymentMadeService.update(id, data),
    onSuccess: () => {
      toast.success("Payment made updated successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update payment made");
    },
  });
};

export const useDeletePaymentMade = () => {
  return useMutation({
    mutationFn: (id: string) => paymentMadeService.delete(id),
    onSuccess: () => {
      toast.success("Payment made deleted successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete payment made");
    },
  });
};

export const useChangePaymentMadeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PaymentMadeChangeStatusRequest) =>
      paymentMadeService.changeStatus(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...paymentMadeQueryKeys.all, "pending-approval"],
      });
      toast.success("Payment made status changed successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to change payment made status");
    },
  });
};

export const usePrintPaymentMade = (id?: string) => {
  return useQuery({
    queryKey: [...paymentMadeQueryKeys.all, "print", id],
    queryFn: () => paymentMadeService.getPrint(id!),
    enabled: !!id,
  });
};
