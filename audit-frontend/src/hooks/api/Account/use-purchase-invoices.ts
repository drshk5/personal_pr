import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  PurchaseInvoiceCreate,
  PurchaseInvoiceParams,
  PurchaseInvoiceUpdate,
  PurchaseInvoicePendingApprovalParams,
  PurchaseInvoiceChangeStatusRequest,
  VendorPendingPurchaseInvoiceParams,
} from "@/types/Account/purchase-invoice";
import { purchaseInvoiceService } from "@/services/Account/purchase-invoice.service";

export const purchaseInvoiceQueryKeys = createQueryKeys("purchase-invoices");

export const usePurchaseInvoices = (params?: PurchaseInvoiceParams) => {
  return useQuery({
    queryKey: purchaseInvoiceQueryKeys.list(params || {}),
    queryFn: () => purchaseInvoiceService.getPurchaseInvoices(params),
  });
};

export const usePendingApprovalPurchaseInvoices = (
  params?: PurchaseInvoicePendingApprovalParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["purchase-invoices-pending-approval", params],
    queryFn: () =>
      purchaseInvoiceService.getPendingApprovalPurchaseInvoices(params),
    enabled: options?.enabled,
  });
};

export const usePurchaseInvoice = (id?: string) => {
  return useQuery({
    queryKey: purchaseInvoiceQueryKeys.detail(id || ""),
    queryFn: () => purchaseInvoiceService.getPurchaseInvoice(id!),
    enabled: !!id,
  });
};

export const usePurchaseInvoicePrint = (id?: string) => {
  return useQuery({
    queryKey: ["purchase-invoice-print", id],
    queryFn: () => purchaseInvoiceService.getPurchaseInvoicePrint(id!),
    enabled: !!id,
  });
};

export const usePendingPaymentsByVendor = (
  params?: VendorPendingPurchaseInvoiceParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["purchase-invoice-pending-payments", params],
    queryFn: () => purchaseInvoiceService.getPendingPaymentsByVendor(params!),
    enabled: options?.enabled !== false && !!params?.strVendorGUID,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
};

export const usePurchaseInvoicesDropdown = (
  params?: { search?: string },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["purchase-invoices-dropdown", params],
    queryFn: () => purchaseInvoiceService.getPurchaseInvoicesDropdown(params),
    enabled: options?.enabled,
  });
};

export const useCreatePurchaseInvoice = () => {
  return useMutation({
    mutationFn: (data: {
      purchaseInvoice: PurchaseInvoiceCreate;
      files?: File[];
    }) =>
      purchaseInvoiceService.createPurchaseInvoice(
        data.purchaseInvoice,
        data.files
      ),
    onSuccess: async () => {
      toast.success("Purchase invoice created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create purchase invoice"),
  });
};

export const useUpdatePurchaseInvoice = () => {
  return useMutation({
    mutationFn: (data: {
      id: string;
      purchaseInvoice: PurchaseInvoiceUpdate;
      files?: File[];
      removeDocumentIds?: string[];
    }) =>
      purchaseInvoiceService.updatePurchaseInvoice(
        data.id,
        data.purchaseInvoice,
        data.files,
        data.removeDocumentIds
      ),
    onSuccess: async () => {
      toast.success("Purchase invoice updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update purchase invoice"),
  });
};

export const useDeletePurchaseInvoice = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      purchaseInvoiceService.deletePurchaseInvoice(id),
    onSuccess: async () => {
      toast.success("Purchase invoice deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete purchase invoice"),
  });
};

export const useBulkChangePurchaseInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PurchaseInvoiceChangeStatusRequest) =>
      purchaseInvoiceService.changeStatus(request),
    onSuccess: async () => {
      toast.success("Purchase invoice status updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["purchase-invoices-pending-approval"],
      });
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update purchase invoice status"),
  });
};
