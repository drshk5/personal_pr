import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  PauseCircle,
} from "lucide-react";
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

type ConfirmationVariant =
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "reject"
  | "hold"
  | "incomplete";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
  loadingText?: string;
  // Reason input props
  showReasonInput?: boolean;
  reason?: string;
  onReasonChange?: (reason: string) => void;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
}

const variantConfig = {
  success: {
    icon: CheckCircle,
    iconColor: "text-green-500",
    buttonVariant: "default" as const,
    defaultTitle: "Confirm Action",
    defaultConfirm: "Confirm",
  },
  warning: {
    icon: AlertCircle,
    iconColor: "text-orange-500",
    buttonVariant: "default" as const,
    defaultTitle: "Confirm Action",
    defaultConfirm: "Confirm",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    buttonVariant: "default" as const,
    defaultTitle: "Confirm Action",
    defaultConfirm: "Confirm",
  },
  danger: {
    icon: AlertTriangle,
    iconColor: "text-red-500",
    buttonVariant: "destructive" as const,
    defaultTitle: "Confirm Action",
    defaultConfirm: "Confirm",
  },
  reject: {
    icon: XCircle,
    iconColor: "text-red-500",
    buttonVariant: "destructive" as const,
    defaultTitle: "Reject Item",
    defaultConfirm: "Reject",
  },
  hold: {
    icon: PauseCircle,
    iconColor: "text-orange-500",
    buttonVariant: "default" as const,
    defaultTitle: "Put on Hold",
    defaultConfirm: "Hold",
  },
  incomplete: {
    icon: AlertCircle,
    iconColor: "text-yellow-500",
    buttonVariant: "default" as const,
    defaultTitle: "Mark as Incomplete",
    defaultConfirm: "Mark Incomplete",
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "info",
  isLoading = false,
  loadingText,
  showReasonInput = false,
  reason = "",
  onReasonChange,
  reasonLabel = "Reason",
  reasonPlaceholder = "Enter reason...",
  reasonRequired = false,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    if (showReasonInput) {
      if (reasonRequired && !reason.trim()) {
        return;
      }
      onConfirm(reason);
    } else {
      onConfirm();
    }
  };

  const isConfirmDisabled =
    isLoading || (showReasonInput && reasonRequired && !reason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={showReasonInput ? "max-w-125" : undefined}>
        <DialogHeader>
          <DialogTitle className="flex text-foreground items-center gap-2">
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
            {title || config.defaultTitle}
          </DialogTitle>
        </DialogHeader>
        {description && <DialogDescription>{description}</DialogDescription>}

        {showReasonInput && (
          <div className="mt-2">
            <div className="grid gap-2">
              <Label htmlFor="reason">
                {reasonLabel}
                {reasonRequired && " *"}
              </Label>
              <Textarea
                id="reason"
                placeholder={reasonPlaceholder}
                value={reason}
                onChange={(e) => onReasonChange?.(e.target.value)}
                className="h-24"
                required={reasonRequired}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2 mt-4">
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
            disabled={isConfirmDisabled}
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
