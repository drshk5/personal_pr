import { useRef, useState } from "react";
import {
  ChevronDown,
  FileText,
  Mic,
  MonitorUp,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import type { AttachmentFile } from "@/types/common";
import type { Document } from "@/types/central/document";
import type { ModuleType } from "@/config/upload-limits";

import { getFileIconInfo } from "@/lib/utils/file-utils";

import { environment } from "@/config/environment";
import { getUploadConfig } from "@/config/upload-limits";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileIcon } from "@/components/ui/file-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { DocumentAttachmentModal } from "./DocumentAttachmentModal";
import {
  AttachmentPreviewDialog,
  type PreviewFile,
} from "./AttachmentPreviewDialog";
import { AudioRecorder } from "./AudioRecorder";

export interface AttachmentManagerProps {
  existingFiles: AttachmentFile[];
  onExistingFileRemove: (guid: string) => void;
  onNewFileAdd: (files: File[]) => void;
  onNewFileRemove: (index: number) => void;
  newFiles: File[];
  onAttachFromDocuments?: (documents: Document[]) => void;
  selectedDocuments?: Document[];
  onSelectedDocumentRemove?: (guid: string) => void;
  module?: ModuleType;
  readOnly?: boolean;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  existingFiles,
  onExistingFileRemove,
  onNewFileAdd,
  onNewFileRemove,
  newFiles,
  onAttachFromDocuments,
  selectedDocuments = [],
  onSelectedDocumentRemove,
  module,
  readOnly = false,
}) => {
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isAudioRecorderOpen, setIsAudioRecorderOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const uploadConfig = getUploadConfig(module);
  const MAX_ATTACHMENTS = uploadConfig.maxFilesPerUpload;
  const MAX_FILE_SIZE_MB = uploadConfig.maxFileSizeMB;

  const currentAttachmentCount =
    existingFiles.length + newFiles.length + selectedDocuments.length;

  const getFileUrl = (file: (typeof existingFiles)[0]): string => {
    if (file.strFilePath) {
      // Use the direct file path for files that have been saved to disk
      const baseUrl = environment.baseUrl;
      return `${baseUrl}${file.strFilePath}`;
    }
    // Fallback to document endpoint for files without direct path
    const baseUrl = environment.baseUrl;
    return `${baseUrl}/api/document/file/${file.strDocumentAssociationGUID}`;
  };

  const allFiles: PreviewFile[] = [
    ...existingFiles.map((file) => {
      const fileExt = file.strFileType?.toLowerCase() || "";
      const iconInfo = getFileIconInfo(fileExt);
      const isPdf = fileExt === "pdf" || fileExt === ".pdf";
      const isAudio = iconInfo.type === "audio";

      // Convert file extension to proper MIME type for HTML5 elements
      let mimeType = fileExt;
      if (fileExt === "webm") {
        mimeType = "audio/webm";
      } else if (fileExt === "mp3") {
        mimeType = "audio/mpeg";
      } else if (fileExt === "wav") {
        mimeType = "audio/wav";
      } else if (fileExt === "ogg") {
        mimeType = "audio/ogg";
      } else if (fileExt === "m4a") {
        mimeType = "audio/mp4";
      }

      return {
        url: getFileUrl(file),
        name: `${file.strFileName}.${file.strFileType}`,
        type: mimeType,
        isImage: iconInfo.type === "image",
        isPdf,
        isAudio,
        size: file.strFileSize,
      };
    }),
    ...newFiles.map((file) => {
      const iconInfo = getFileIconInfo(file.type);
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      const isAudio = iconInfo.type === "audio";
      return {
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        isImage: iconInfo.type === "image",
        isPdf,
        isAudio,
        size: formatFileSize(file.size),
      };
    }),
  ];

  const handleFileUpload = () => {
    if (currentAttachmentCount >= MAX_ATTACHMENTS) {
      toast.error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const files = Array.from(target.files);
        const remainingSlots = MAX_ATTACHMENTS - currentAttachmentCount;

        if (files.length > remainingSlots) {
          toast.error(
            `You can only attach ${remainingSlots} more file${
              remainingSlots > 1 ? "s" : ""
            }. Maximum ${MAX_ATTACHMENTS} attachments allowed.`
          );
          return;
        }

        const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
        const oversizedFiles = files.filter((file) => file.size > maxSizeBytes);

        if (oversizedFiles.length > 0) {
          toast.error(
            `${oversizedFiles.length} file(s) exceed the maximum size of ${MAX_FILE_SIZE_MB}MB`
          );
          return;
        }

        onNewFileAdd(files);
      }
    };
    input.click();
  };

  const handleAttachFromDocuments = (documents: Document[]) => {
    if (onAttachFromDocuments) {
      onAttachFromDocuments(documents);
    }
  };

  const handleStartAudioRecording = () => {
    if (currentAttachmentCount >= MAX_ATTACHMENTS) {
      toast.error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      return;
    }
    setIsAudioRecorderOpen(true);
  };

  const handleAudioRecorded = (file: File) => {
    onNewFileAdd([file]);
    setIsAudioRecorderOpen(false);
  };

  const handleCancelAudioRecording = () => {
    setIsAudioRecorderOpen(false);
  };

  if (
    readOnly &&
    existingFiles.length === 0 &&
    selectedDocuments.length === 0
  ) {
    return null;
  }

  return (
    <div className="mt-6 ">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <h3 className="text-base sm:text-lg font-medium">Attachments</h3>
      </div>
      <div className="flex items-center">
        <div className="flex">
          <Button
            variant="outline"
            type="button"
            className="flex items-center gap-2 rounded-r-none border-r-0"
            onClick={handleFileUpload}
            disabled={readOnly || currentAttachmentCount >= MAX_ATTACHMENTS}
          >
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                type="button"
                className="rounded-l-none px-2"
                disabled={readOnly || currentAttachmentCount >= MAX_ATTACHMENTS}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onClick={handleFileUpload}
                disabled={readOnly || currentAttachmentCount >= MAX_ATTACHMENTS}
              >
                <MonitorUp className="h-4 w-4" />
                Attach From Desktop
              </DropdownMenuItem>
              {onAttachFromDocuments && (
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setIsDocumentModalOpen(true)}
                  disabled={
                    readOnly || currentAttachmentCount >= MAX_ATTACHMENTS
                  }
                >
                  <FileText className="h-4 w-4" />
                  Attach From Documents
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onClick={handleStartAudioRecording}
                disabled={readOnly || currentAttachmentCount >= MAX_ATTACHMENTS}
              >
                <Mic className="h-4 w-4" />
                Record Audio
              </DropdownMenuItem>
              {/* <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <Cloud className="h-4 w-4" />
                Attach From Cloud
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {(newFiles.length > 0 ||
          existingFiles.length > 0 ||
          selectedDocuments.length > 0) && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="default"
                className="text-sm text-white flex items-center gap-1 ml-2"
              >
                <Paperclip className="h-4 w-4" />
                {newFiles.length +
                  existingFiles.length +
                  selectedDocuments.length}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 border-border-color" align="start">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Documents</h4>
                  <span className="text-xs text-muted-foreground">
                    {newFiles.length +
                      existingFiles.length +
                      selectedDocuments.length}{" "}
                    files
                  </span>
                </div>
                <div
                  ref={scrollContainerRef}
                  className="space-y-2 max-h-48 min-h-0 overflow-y-auto overscroll-contain pr-1"
                  style={{ touchAction: "pan-y" }}
                  onWheel={(e) => {
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollTop += e.deltaY;
                      e.preventDefault();
                    }
                  }}
                >
                  {existingFiles.map((file, index) => (
                    <div
                      key={file.strDocumentAssociationGUID}
                      className="flex items-center gap-3 p-2 border rounded-sm hover:bg-gray-50 dark:hover:bg-gray-800 border-border-color cursor-pointer select-none"
                      onClick={() => setPreviewIndex(index)}
                    >
                      <div className="shrink-0">
                        <FileIcon fileType={file.strFileType} size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          title={`${file.strFileName}.${file.strFileType}`}
                        >
                          {file.strFileName}.{file.strFileType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          File Size: {file.strFileSize}
                        </p>
                      </div>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExistingFileRemove(
                              file.strDocumentAssociationGUID
                            );
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {newFiles.map((file, index) => (
                    <div
                      key={`new-${index}`}
                      className="flex items-center gap-3 p-2 border rounded-sm hover:bg-gray-50 dark:hover:bg-gray-800 border-border-color cursor-pointer select-none"
                      onClick={() =>
                        setPreviewIndex(existingFiles.length + index)
                      }
                    >
                      <div className="shrink-0">
                        <FileIcon fileType={file.type} size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          title={file.name}
                        >
                          {file.name}
                          <span className="ml-1 text-xs text-blue-500">
                            (New)
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          File Size: {formatFileSize(file.size)}
                        </p>
                      </div>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNewFileRemove(index);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {selectedDocuments.map((doc) => (
                    <div
                      key={doc.strDocumentGUID}
                      className="flex items-center gap-3 p-2 border rounded-sm hover:bg-gray-50 dark:hover:bg-gray-800 border-border-color"
                    >
                      <div className="shrink-0">
                        <FileIcon fileType={doc.strFileType} size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          title={`${doc.strFileName}${
                            doc.strFileType
                              ? `.${doc.strFileType.toLowerCase()}`
                              : ""
                          }`}
                        >
                          {doc.strFileName}
                          {doc.strFileType &&
                            `.${doc.strFileType.toLowerCase()}`}
                          <span className="ml-1 text-xs text-purple-500">
                            (From Library)
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          File Size: {doc.strFileSize || "Unknown"}
                        </p>
                      </div>
                      {!readOnly && onSelectedDocumentRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500"
                          onClick={() =>
                            onSelectedDocumentRemove(doc.strDocumentGUID)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {!readOnly && (
        <span className="text-xs sm:text-sm text-muted-foreground mt-2 block">
          You can upload a maximum of {MAX_ATTACHMENTS} files,{" "}
          {MAX_FILE_SIZE_MB}
          MB each
        </span>
      )}

      {!readOnly && onAttachFromDocuments && (
        <DocumentAttachmentModal
          open={isDocumentModalOpen}
          onOpenChange={setIsDocumentModalOpen}
          onAttach={handleAttachFromDocuments}
          currentAttachmentCount={currentAttachmentCount}
          maxAttachments={MAX_ATTACHMENTS}
        />
      )}

      <AttachmentPreviewDialog
        files={allFiles}
        currentIndex={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onIndexChange={setPreviewIndex}
      />

      <AudioRecorder
        open={isAudioRecorderOpen}
        onAudioSaved={handleAudioRecorded}
        onCancel={handleCancelAudioRecording}
      />
    </div>
  );
};
