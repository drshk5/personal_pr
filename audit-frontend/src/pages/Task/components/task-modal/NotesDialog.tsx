import React from "react";

import { ModalDialog } from "@/components/ui/modal-dialog";

interface NotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  maxWidth?: string;
}

export const NotesDialog: React.FC<NotesDialogProps> = ({
  open,
  onOpenChange,
  title = "Notes",
  description,
  maxWidth = "500px",
}) => {
  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      maxWidth={maxWidth}
      showCloseButton={true}
      className="max-h-[80vh]"
    >
      <div className="px-6 py-4 max-h-[calc(80vh-120px)] overflow-y-auto">
        <div 
          className="text-base text-foreground leading-relaxed max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-3 [&_li]:mb-1 [&_li]:text-base [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm [&_a]:text-primary [&_a]:hover:underline"
          dangerouslySetInnerHTML={{ 
            __html: description || "<p>No description available</p>"
          }}
        />
      </div>
    </ModalDialog>
  );
};
