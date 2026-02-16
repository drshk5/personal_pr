/**
 * @deprecated This component has been superseded by ConfirmationDialog with showReasonInput prop.
 * Please use ConfirmationDialog instead:
 *
 * @example
 * // Instead of:
 * // <ReasonDialog variant="reject" reason={reason} onReasonChange={setReason} onConfirm={handleReject} />
 *
 * // Use:
 * // <ConfirmationDialog
 * //   variant="reject"
 * //   showReasonInput={true}
 * //   reason={reason}
 * //   onReasonChange={setReason}
 * //   reasonRequired={true}
 * //   onConfirm={handleReject}
 * // />
 *
 * This file will be removed in a future version.
 */

import { XCircle, PauseCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReasonDialogVariant = "reject" | "hold" | "incomplete" | "custom";

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  title?: string;
  description?: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ReasonDialogVariant;
  isLoading?: boolean;
  loadingText?: string;
  required?: boolean;
}

const variantConfig = {
  reject: {
    icon: XCircle,
    iconColor: "text-red-500",
    buttonVariant: "destructive" as const,
    defaultTitle: "Reject Item",
    defaultDescription: "Please provide a reason for rejection.",
    defaultLabel: "Rejection Reason",
    defaultPlaceholder: "Enter reason for rejection...",
    defaultConfirm: "Reject",
  },
  hold: {
    icon: PauseCircle,
    iconColor: "text-orange-500",
    buttonVariant: "default" as const,
    defaultTitle: "Put on Hold",
    defaultDescription:
      "Provide a reason. Timer will stop and time will be recorded.",
    defaultLabel: "Reason",
    defaultPlaceholder: "Describe why you're pausing this...",
    defaultConfirm: "Hold",
  },
  incomplete: {
    icon: AlertCircle,
    iconColor: "text-yellow-500",
    buttonVariant: "default" as const,
    defaultTitle: "Mark as Incomplete",
    defaultDescription:
      "Provide a reason. Timer will stop and time will be recorded.",
    defaultLabel: "Reason",
    defaultPlaceholder: "Describe why you're marking this incomplete...",
    defaultConfirm: "Mark Incomplete",
  },
  custom: {
    icon: AlertCircle,
    iconColor: "text-blue-500",
    buttonVariant: "default" as const,
    defaultTitle: "Provide Reason",
    defaultDescription: "Please provide a reason for this action.",
    defaultLabel: "Reason",
    defaultPlaceholder: "Enter reason...",
    defaultConfirm: "Submit",
  },
};

export function ReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  reason,
  onReasonChange,
  title,
  description,
  reasonLabel,
  reasonPlaceholder,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "custom",
  isLoading = false,
  loadingText,
  required = true,
}: ReasonDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    if (required && !reason.trim()) {
      return;
    }
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-125">
        <DialogHeader>
          <DialogTitle className="flex text-foreground items-center gap-2">
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
            {title || config.defaultTitle}
          </DialogTitle>
          <DialogDescription>
            {description || config.defaultDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <div className="grid gap-2">
            <Label htmlFor="reason">
              {reasonLabel || config.defaultLabel}
              {required && " *"}
            </Label>
            <Textarea
              id="reason"
              placeholder={reasonPlaceholder || config.defaultPlaceholder}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="h-24"
              required={required}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
            }}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={config.buttonVariant}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleConfirm();
            }}
            disabled={(required && !reason.trim()) || isLoading}
          >
            {isLoading
              ? loadingText || `${confirmLabel || config.defaultConfirm}ing...`
              : confirmLabel || config.defaultConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
