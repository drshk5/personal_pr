import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
} from "@/components/ui/shadcn-io/image-crop";

import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { useEffect, type RefObject } from "react";

export interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  title?: string;
  description?: string;
  helperText?: string;
  maxImageSize?: number;
  onCrop: (croppedImage: string) => void;
  aspect?: number;
  circularCrop?: boolean;
  applyButtonText?: string;
  cancelButtonText?: string;
  fileInputRef?: RefObject<HTMLInputElement | null>;
}

function ImageCropDialogContent({
  onOpenChange,
  helperText,
  applyButtonText,
  cancelButtonText,
}: {
  onOpenChange: (open: boolean) => void;
  helperText: string;
  applyButtonText: string;
  cancelButtonText: string;
}) {
  return (
    <>
      <div className="px-6 py-4">
        <div className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {helperText}
          </div>
          <div className="flex justify-center">
            <ImageCropContent className="max-w-full rounded-md overflow-hidden" />
          </div>
        </div>
      </div>
      <div className="shrink-0 border-t bg-gray-50 rounded-b-(--radius) dark:bg-muted/40 w-full">
        <div className="px-3 py-3 sm:px-6 sm:py-4 flex w-full justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {cancelButtonText}
          </Button>
          <ImageCropApply asChild>
            <Button type="button">{applyButtonText}</Button>
          </ImageCropApply>
        </div>
      </div>
    </>
  );
}

export function ImageCropDialog({
  open,
  onOpenChange,
  file,
  title = "Crop Image",
  description = "Drag to adjust the cropping area",
  helperText = "Adjust the circular crop to select your image",
  maxImageSize = 1024 * 1024 * 2,
  onCrop,
  aspect = 1,
  circularCrop = true,
  applyButtonText = "Apply",
  cancelButtonText = "Cancel",
  fileInputRef,
}: ImageCropDialogProps) {
  // Reset file input when dialog opens to allow selecting the same file again
  useEffect(() => {
    if (open && fileInputRef?.current) {
      fileInputRef.current.value = "";
    }
  }, [open, fileInputRef]);

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      maxWidth="500px"
      showCloseButton={true}
    >
      {file && (
        <ImageCrop
          file={file}
          maxImageSize={maxImageSize}
          onCrop={onCrop}
          aspect={aspect}
          circularCrop={circularCrop}
        >
          <ImageCropDialogContent
            onOpenChange={onOpenChange}
            helperText={helperText}
            applyButtonText={applyButtonText}
            cancelButtonText={cancelButtonText}
          />
        </ImageCrop>
      )}
    </ModalDialog>
  );
}
