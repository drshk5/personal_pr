import type { BadgeProps } from "@/components/ui/badge";

/**
 * Gets the badge variant for a document status.
 * Handles case-insensitive matching for status values across different modules.
 *
 * @param status - Status string from backend (e.g., "Draft", "DRAFT", "Pending For Approval", "PendingForApproval", "Approved", "Rejected", "Received", "PAID", "PENDING")
 * @returns Badge variant for styling
 */
export const getStatusBadgeVariant = (
  status: string | null | undefined
): BadgeProps["variant"] => {
  if (!status) return "outline";

  // Normalize status for case-insensitive matching
  const normalizedStatus = status.toLowerCase().trim();

  if (normalizedStatus === "draft") return "draft";
  if (
    normalizedStatus === "pending for approval" ||
    normalizedStatus === "pendingforapproval" ||
    normalizedStatus === "pending"
  )
    return "pending";
  if (normalizedStatus === "approved") return "approved";
  if (normalizedStatus === "rejected") return "rejected";
  if (normalizedStatus === "received" || normalizedStatus === "paid")
    return "approved";

  return "outline";
};
