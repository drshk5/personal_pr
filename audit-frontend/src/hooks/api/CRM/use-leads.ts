import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { leadService } from "@/services/CRM/lead.service";
import type {
  CreateLeadDto,
  UpdateLeadDto,
  LeadFilterParams,
  LeadBulkArchiveDto,
  ConvertLeadDto,
  LeadMergeDto,
  LeadImportMappingDto,
  BulkAssignDto,
  CreateScoringRuleDto,
  UpdateScoringRuleDto,
} from "@/types/CRM/lead";

export const leadQueryKeys = createQueryKeys("crm-leads");

// Additional query key factories for sub-resources
const analyticsKeys = createQueryKeys("crm-lead-analytics");
const scoringRuleKeys = createQueryKeys("crm-lead-scoring-rules");
const assignmentRuleKeys = createQueryKeys("crm-lead-assignment-rules");
const slaKeys = createQueryKeys("crm-lead-sla");

// ── Core CRUD ──────────────────────────────────────────────────

export const useLeads = (params?: LeadFilterParams) => {
  return useQuery({
    queryKey: leadQueryKeys.list(params || {}),
    queryFn: () => leadService.getLeads(params),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
};

export const useLead = (id?: string) => {
  return useQuery({
    queryKey: leadQueryKeys.detail(id || ""),
    queryFn: () => leadService.getLead(id!),
    enabled: !!id,
    // Always fetch fresh data when navigating to edit page
    // (overrides global refetchOnMount: false)
    refetchOnMount: "always",
    staleTime: 0,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLeadDto) => leadService.createLead(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success("Lead created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create lead"),
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadDto }) =>
      leadService.updateLead(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success("Lead updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update lead"),
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => leadService.deleteLead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success("Lead deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete lead"),
  });
};

export const useChangeLeadStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      leadService.changeStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success("Lead status updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update lead status"),
  });
};

// ── Bulk Operations ────────────────────────────────────────────

export const useBulkArchiveLeads = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: LeadBulkArchiveDto) => leadService.bulkArchive(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success("Leads archived successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to archive leads"),
  });
};

export const useBulkRestoreLeads = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: LeadBulkArchiveDto) => leadService.bulkRestore(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success("Leads restored successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to restore leads"),
  });
};

// ── Lead Conversion ────────────────────────────────────────────

export const useConvertLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ConvertLeadDto) => leadService.convertLead(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success("Lead converted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to convert lead"),
  });
};

// ── Duplicate Detection & Merge ────────────────────────────────

export const useCheckDuplicates = (
  email: string,
  firstName?: string,
  lastName?: string
) => {
  return useQuery({
    queryKey: ["crm-lead-duplicates", email, firstName, lastName],
    queryFn: () => leadService.checkDuplicates(email, firstName, lastName),
    enabled: !!email && email.length > 3,
  });
};

export const useMergeLeads = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: LeadMergeDto) => leadService.mergeLeads(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success("Leads merged successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to merge leads"),
  });
};

// ── Import / Export ────────────────────────────────────────────

export const useImportLeads = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      mappings,
      duplicateHandling,
    }: {
      file: File;
      mappings: LeadImportMappingDto[];
      duplicateHandling?: string;
    }) => leadService.importLeads(file, mappings, duplicateHandling),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success(
        `Import complete: ${result.intSuccessRows} created, ${result.intDuplicateRows} duplicates, ${result.intErrorRows} errors`
      );
    },
    onError: (error) => handleMutationError(error, "Failed to import leads"),
  });
};

export const useExportLeads = () => {
  return useMutation({
    mutationFn: ({
      params,
      format,
    }: {
      params?: LeadFilterParams;
      format?: "csv" | "excel";
    }) => leadService.exportLeads(params, format),
    onSuccess: (blob, { format = "csv" }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-export.${format === "excel" ? "xlsx" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Leads exported successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to export leads"),
  });
};

export const useDownloadImportTemplate = () => {
  return useMutation({
    mutationFn: () => leadService.downloadImportTemplate(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lead-import-template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Template downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to download template"),
  });
};

// ── Assignment ─────────────────────────────────────────────────

export const useBulkAssignLeads = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkAssignDto) => leadService.bulkAssign(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success("Leads assigned successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to assign leads"),
  });
};

export const useAutoAssignLeads = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (guids: string[]) => leadService.autoAssign(guids),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success(`${result.intAssigned} leads auto-assigned`);
    },
    onError: (error) =>
      handleMutationError(error, "Failed to auto-assign leads"),
  });
};

export const useAssignmentRules = (enabled = true) => {
  return useQuery({
    queryKey: assignmentRuleKeys.all,
    queryFn: () => leadService.getAssignmentRules(),
    enabled,
  });
};

// ── Analytics & Funnel ─────────────────────────────────────────

export const useLeadAnalytics = (dtFromDate?: string, dtToDate?: string) => {
  return useQuery({
    queryKey: analyticsKeys.list({ dtFromDate, dtToDate }),
    queryFn: () => leadService.getAnalytics(dtFromDate, dtToDate),
  });
};

// ── SLA / Aging ────────────────────────────────────────────────

export const useLeadSLAConfig = () => {
  return useQuery({
    queryKey: slaKeys.all,
    queryFn: () => leadService.getSLAConfig(),
  });
};

// ── Scoring Rules ──────────────────────────────────────────────

export const useScoringRules = () => {
  return useQuery({
    queryKey: scoringRuleKeys.all,
    queryFn: () => leadService.getScoringRules(),
  });
};

export const useCreateScoringRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateScoringRuleDto) =>
      leadService.createScoringRule(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: scoringRuleKeys.all,
      });
      toast.success("Scoring rule created");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create scoring rule"),
  });
};

export const useUpdateScoringRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScoringRuleDto }) =>
      leadService.updateScoringRule(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: scoringRuleKeys.all,
      });
      toast.success("Scoring rule updated");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update scoring rule"),
  });
};

export const useDeleteScoringRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => leadService.deleteScoringRule(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: scoringRuleKeys.all,
      });
      toast.success("Scoring rule deleted");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete scoring rule"),
  });
};
