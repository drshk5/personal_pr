import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { docNoService } from "@/services/Account/doc-no.service";
import type {
  DocNoCreate,
  DocNoParams,
  DocNoUpdate,
  DocNoCopyFromRequest,
  DocNoGenerateRequest,
} from "@/types/Account/doc-no";
import { toast } from "sonner";
import { handleMutationError } from "../common";

export const DOC_NOS_KEY = "doc-nos";

export const useDocNos = (params: DocNoParams = {}) => {
  return useQuery({
    queryKey: [DOC_NOS_KEY, params],
    queryFn: () => docNoService.getDocNos(params),
  });
};

export const useDocNo = (docNoId: string) => {
  return useQuery({
    queryKey: [DOC_NOS_KEY, docNoId],
    queryFn: () => docNoService.getDocNo(docNoId),
    enabled: !!docNoId,
  });
};

export const useCreateDocNo = () => {
  return useMutation({
    mutationFn: (docNo: DocNoCreate) => {
      return docNoService.createDocNo(docNo);
    },
    onSuccess: () => {
      toast.success("Document number created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create document number"),
  });
};

export const useUpdateDocNo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strDocumentNoGUID,
      ...docNo
    }: DocNoUpdate & { strDocumentNoGUID: string }) => {
      return docNoService.updateDocNo(strDocumentNoGUID, docNo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOC_NOS_KEY] });
      toast.success("Document number updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update document number"),
  });
};

export const useDeleteDocNo = () => {
  return useMutation({
    mutationFn: (docNoId: string) => {
      return docNoService.deleteDocNo(docNoId);
    },
    onSuccess: () => {
      toast.success("Document number deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete document number"),
  });
};

export const useCopyDocNosFromYear = () => {
  return useMutation({
    mutationFn: (request: DocNoCopyFromRequest) => {
      return docNoService.copyDocNosFromYear(request);
    },
    onSuccess: () => {
      toast.success("Document numbers copied successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to copy document numbers"),
  });
};

export const useGenerateDocNo = () => {
  return useMutation({
    mutationFn: (request: DocNoGenerateRequest) => {
      return docNoService.generateDocNo(request);
    },
    onError: (error) =>
      handleMutationError(error, "Failed to generate document number"),
  });
};
