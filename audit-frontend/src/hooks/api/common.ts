import { toast } from "sonner";
import { extractErrorDetails } from "@/lib/utils/api-error";

export const handleMutationError = (
  error: unknown,
  defaultMessage: string
): void => {
  const { message, errors } = extractErrorDetails(error);
  const errorMessage = message || defaultMessage;

  if (errors && errors.length > 0) {
    // Show main message with errors as description
    toast.error(errorMessage, {
      description: errors.join("\n"),
    });
  } else {
    toast.error(errorMessage);
  }
};

export const createQueryKeys = (baseName: string) => ({
  all: [baseName] as const,
  lists: () => [...createQueryKeys(baseName).all, "list"] as const,
  list: (params: object) =>
    [...createQueryKeys(baseName).lists(), params] as const,
  details: () => [...createQueryKeys(baseName).all, "detail"] as const,
  detail: (id: string) => [...createQueryKeys(baseName).details(), id] as const,
});
