import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ModalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footerContent?: React.ReactNode;
  headerActions?: React.ReactNode;
  showCloseButton?: boolean;
  maxWidth?: string;
  fullHeight?: boolean;
  className?: string;
  preventOutsideClick?: boolean;
}

export const ModalDialog: React.FC<ModalDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footerContent,
  headerActions,
  showCloseButton = true,
  maxWidth = "900px",
  fullHeight = false,
  className = "",
  preventOutsideClick = false,
}) => {
  const contentClassName = [
    "flex flex-col text-foreground bg-muted/40 p-0",
    fullHeight ? "h-[90vh] max-h-[90vh]" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={contentClassName}
        style={{ maxWidth: maxWidth, width: "100%" }}
        onPointerDownOutside={(e) => {
          if (preventOutsideClick) {
            e.preventDefault();
          }
        }}
      >
        {showCloseButton && (
          <DialogClose className="absolute right-2 top-2 sm:right-4 sm:top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        )}

        <DialogHeader className="px-3 py-3 sm:px-6 sm:py-4 border-b border-border-color shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <DialogTitle className="text-base sm:text-xl font-semibold pr-6">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-xs sm:text-sm">
                  {description}
                </DialogDescription>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center gap-2 mr-8">
                {headerActions}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 min-h-0">{children}</div>

        {footerContent && (
          <div className="shrink-0 border-t border-border-color bg-gray-50 rounded-b-lg dark:bg-muted/40 w-full">
            <DialogFooter className="px-3 py-3 sm:px-6 sm:py-4">
              <div className="flex w-full justify-between">{footerContent}</div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
