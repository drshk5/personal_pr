import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  InvoiceCreate,
  InvoiceParams,
  InvoiceUpdate,
  PendingApprovalParams,
  ChangeStatusRequest,
  InvoiceDropdownParams,
  CustomerPendingInvoiceParams,
} from "@/types/Account/salesinvoice";
import { invoiceService } from "@/services/Account/salesinvoice.service";

export const invoiceQueryKeys = createQueryKeys("invoices");

export const useInvoices = (params?: InvoiceParams) => {
  return useQuery({
    queryKey: invoiceQueryKeys.list(params || {}),
    queryFn: () => invoiceService.getInvoices(params),
  });
};

export const usePendingApprovalInvoices = (
  params?: PendingApprovalParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["invoices-pending-approval", params],
    queryFn: () => invoiceService.getPendingApprovalInvoices(params),
    enabled: options?.enabled,
  });
};

export const useInvoice = (id?: string) => {
  return useQuery({
    queryKey: invoiceQueryKeys.detail(id || ""),
    queryFn: () => invoiceService.getInvoice(id!),
    enabled: !!id,
  });
};

export const useInvoicesDropdown = (
  params?: InvoiceDropdownParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["invoices-dropdown", params],
    queryFn: () => invoiceService.getInvoicesDropdown(params),
    enabled: options?.enabled,
  });
};

export const useCreateInvoice = () => {
  return useMutation({
    mutationFn: (data: { invoice: InvoiceCreate; files?: File[] }) =>
      invoiceService.createInvoice(data.invoice, data.files),
    onSuccess: async () => {
      toast.success("Sales invoice created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create sales invoice"),
  });
};

export const useUpdateInvoice = () => {
  return useMutation({
    mutationFn: (data: {
      id: string;
      invoice: InvoiceUpdate;
      files?: File[];
      removeDocumentIds?: string[];
    }) =>
      invoiceService.updateInvoice(
        data.id,
        data.invoice,
        data.files,
        data.removeDocumentIds
      ),
    onSuccess: async () => {
      toast.success("Sales invoice updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update sales invoice"),
  });
};

export const useDeleteInvoice = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string }) => invoiceService.deleteInvoice(id),
    onSuccess: async () => {
      toast.success("Sales invoice deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete sales invoice"),
  });
};

export const useBulkChangeInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ChangeStatusRequest) =>
      invoiceService.changeStatus(request),
    onSuccess: async () => {
      toast.success("Sales Invoice status updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["invoices-pending-approval"],
      });
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update sales invoice status"),
  });
};

export const useInvoicePrint = (id?: string) => {
  return useQuery({
    queryKey: ["invoice-print", id],
    queryFn: () => invoiceService.getInvoicePrint(id!),
    enabled: !!id,
  });
};

export const usePendingInvoicesByCustomer = (
  params?: CustomerPendingInvoiceParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["invoices-pending-by-customer", params],
    queryFn: () => invoiceService.getPendingInvoicesByCustomer(params!),
    enabled: options?.enabled !== false && !!params?.strCustomerGUID,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
};
