import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Folder, FileText, ChevronLeft, X } from "lucide-react";
import { useDocuments } from "@/hooks/api/central/use-documents";
import { useFolders } from "@/hooks/api/central/use-folders";
import type { Document } from "@/types/central/document";
import { formatDate } from "@/lib/utils";
import { cn, getImagePath } from "@/lib/utils";
import { FileIcon } from "@/components/ui/file-icons";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useIsMobile } from "@/hooks/common/use-mobile";

interface DocumentAttachmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttach: (documents: Document[]) => void;
  currentAttachmentCount?: number;
  maxAttachments?: number;
}

export const DocumentAttachmentModal: React.FC<
  DocumentAttachmentModalProps
> = ({
  open,
  onOpenChange,
  onAttach,
  currentAttachmentCount = 0,
  maxAttachments = 5,
}) => {
  const [search, setSearch] = useState("");
  const [selectedFolderGUID, setSelectedFolderGUID] = useState<
    string | undefined
  >(undefined);
  const [selectedDocuments, setSelectedDocuments] = useState<
    Record<string, Document>
  >({});
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(
    null
  );

  const isMobile = useIsMobile();
  const debouncedSearch = useDebounce(search, 500);

  // Calculate available slots
  const availableSlots = maxAttachments - currentAttachmentCount;
  const selectedCount = Object.keys(selectedDocuments).length;

  // Fetch folders - only when modal is open
  const { data: foldersData } = useFolders(undefined, open);
  const folders = foldersData?.data?.items || [];

  // Fetch documents - only when modal is open
  const { data: documentsData, isLoading } = useDocuments(
    {
      pageNumber: 1,
      pageSize: 50,
      sortBy: "strFileName",
      ascending: true,
      search: debouncedSearch,
      bolIsDeleted: false,
      strFolderGUID: selectedFolderGUID,
      strFileType:
        fileTypeFilter && fileTypeFilter !== "all" ? fileTypeFilter : undefined,
    },
    { enabled: open }
  );

  const documents = useMemo<Document[]>(() => {
    if (!documentsData || !documentsData.data.items) return [];
    return documentsData.data.items as Document[];
  }, [documentsData]);

  // Reset selections when folder or search changes
  useEffect(() => {
    setSelectedDocuments({});
  }, [selectedFolderGUID, debouncedSearch, fileTypeFilter]);

  // Close sidebar when folder is selected on mobile
  useEffect(() => {
    if (isMobile && selectedFolderGUID) {
      setShowSidebar(false);
    }
  }, [selectedFolderGUID, isMobile]);

  const handleDocumentToggle = (document: Document) => {
    setSelectedDocuments((prev) => {
      const newSelected = { ...prev };
      if (newSelected[document.strDocumentGUID]) {
        // Allow deselection
        delete newSelected[document.strDocumentGUID];
      } else {
        // Check if we can select more
        const currentCount = Object.keys(newSelected).length;
        if (currentCount < availableSlots) {
          newSelected[document.strDocumentGUID] = document;
        }
      }
      return newSelected;
    });
  };

  const handleAttach = () => {
    const documentsToAttach = Object.values(selectedDocuments);
    onAttach(documentsToAttach);
    setSelectedDocuments({});
    onOpenChange(false);
  };

  const handleFolderClick = (folderGUID: string) => {
    setSelectedFolderGUID(folderGUID);
  };

  const handleBackToAllDocuments = () => {
    setSelectedFolderGUID(undefined);
  };

  const isImageFile = (doc: Document) => {
    const ext = (doc.strFileType || "").toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
  };

  const isPdfFile = (doc: Document) => {
    const ext = (doc.strFileType || "").toLowerCase();
    return ext === "pdf";
  };

  const isPreviewable = (doc: Document) => {
    return (doc.strFilePath && (isImageFile(doc) || isPdfFile(doc)));
  };

  const currentFolder = folders.find(
    (f) => f.strFolderGUID === selectedFolderGUID
  );

  const fileTypeOptions = [
    { value: "all", label: "All" },
    { value: "images", label: "Images" },
    { value: "pdf", label: "PDF" },
    { value: "docs", label: "Docs" },
    { value: "sheets", label: "Sheets" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-5xl max-h-[90vh] sm:max-h-[85vh] min-h-125 sm:min-h-150 flex flex-col p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {selectedFolderGUID && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={handleBackToAllDocuments}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-sm sm:text-base truncate">
                  {selectedFolderGUID && currentFolder
                    ? `${currentFolder.strFolderName}`
                    : "Attach Documents"}
                </DialogTitle>
                {currentAttachmentCount > 0 && availableSlots > 0 && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {availableSlots} of {maxAttachments} slots available
                  </p>
                )}
                {availableSlots === 0 && (
                  <p className="text-[10px] sm:text-xs text-orange-500 mt-1">
                    Maximum attachments reached
                  </p>
                )}
              </div>
            </div>
            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 shrink-0"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <Folder className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile overlay */}
          {isMobile && showSidebar && (
            <div
              className="absolute inset-0 bg-black/20 z-10"
              onClick={() => setShowSidebar(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={cn(
              "w-64 border-r border-border bg-background overflow-y-auto transition-transform duration-300 ease-in-out",
              "md:relative md:translate-x-0",
              isMobile && "absolute inset-y-0 left-0 z-20 shadow-lg border-r-0 border-border",
              isMobile && !showSidebar && "-translate-x-full"
            )}
          >
            <div className="p-3 sm:p-4 space-y-2">
              <Button
                variant={!selectedFolderGUID ? "secondary" : "ghost"}
                className="w-full justify-start text-foreground text-xs sm:text-sm"
                onClick={handleBackToAllDocuments}
              >
                <FileText className="mr-2 h-4 w-4 text-foreground shrink-0" />
                All Documents
              </Button>

              <div className="pt-2 sm:pt-4">
                <h3 className="px-2 mb-2 text-[10px] sm:text-xs font-medium text-muted-foreground">
                  FOLDERS
                </h3>
                <div className="space-y-1">
                  {folders.map((folder) => (
                    <Button
                      key={folder.strFolderGUID}
                      variant={
                        selectedFolderGUID === folder.strFolderGUID
                          ? "secondary"
                          : "ghost"
                      }
                      className="w-full justify-start text-xs sm:text-sm"
                      onClick={() => handleFolderClick(folder.strFolderGUID)}
                    >
                      <Folder className="mr-2 h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left truncate min-w-0">
                        {folder.strFolderName}
                      </span>
                      {folder.intDocumentCount > 0 && (
                        <span className="ml-auto text-[10px] sm:text-xs text-muted-foreground shrink-0">
                          {folder.intDocumentCount}
                        </span>
                      )}
                    </Button>
                  ))}
                  {folders.length === 0 && (
                    <p className="px-2 text-xs sm:text-sm text-muted-foreground">
                      No folders found
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col text-foreground overflow-hidden">
            {/* Search and Filters */}
            <div className="p-3 sm:p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {fileTypeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      fileTypeFilter === option.value ||
                      (!fileTypeFilter && option.value === "all")
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() =>
                      setFileTypeFilter(
                        option.value === "all" ? "" : option.value
                      )
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Loading documents...
                  </p>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    No documents found
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Document Items */}
                  {documents.map((document) => {
                    const isSelected =
                      !!selectedDocuments[document.strDocumentGUID];
                    const isDisabled =
                      !isSelected && selectedCount >= availableSlots;

                    const canPreview = isPreviewable(document);

                    return (
                      <div
                        key={document.strDocumentGUID}
                        className={cn(
                          "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-border rounded-lg transition-colors",
                          !isDisabled && "hover:bg-muted/50 cursor-pointer",
                          isSelected && "bg-muted border-primary",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() =>
                          !isDisabled && handleDocumentToggle(document)
                        }
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            !isDisabled && handleDocumentToggle(document)
                          }
                          onClick={(e) => e.stopPropagation()}
                          disabled={isDisabled}
                          className="shrink-0"
                        />
                        <FileIcon
                          fileType={document.strFileType}
                          size={isMobile ? 20 : 24}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-xs sm:text-sm">
                            {document.strFileName}
                            {document.strFileType &&
                              `.${document.strFileType.toLowerCase()}`}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                            {document.strFolderName && (
                              <>
                                <Folder className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-30 sm:max-w-none">
                                  {document.strFolderName}
                                </span>
                                <span className="hidden sm:inline">•</span>
                              </>
                            )}
                            <span className="truncate">
                              {formatDate(document.dtUploadedOn, true)}
                            </span>
                            {document.strFileSize && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">
                                  {document.strFileSize}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {canPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewDocument(document);
                            }}
                          >
                            Preview
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
          <div className="text-[10px] sm:text-xs text-center sm:text-left">
            {selectedCount > 0 ? (
              <>
                <span className="text-foreground font-medium">
                  {selectedCount} document{selectedCount > 1 ? "s" : ""}{" "}
                  selected
                </span>
                {availableSlots > selectedCount && (
                  <span className="text-muted-foreground ml-1">
                    • {availableSlots - selectedCount} more available
                  </span>
                )}
                {availableSlots === selectedCount && (
                  <span className="text-orange-500 ml-1">
                    • Maximum reached
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">
                {availableSlots === 0
                  ? "Maximum attachments reached"
                  : `Select up to ${availableSlots} document${
                      availableSlots > 1 ? "s" : ""
                    }`}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAttach}
              disabled={selectedCount === 0}
              className="flex-1 sm:flex-initial"
            >
              Attach {selectedCount > 0 && `(${selectedCount})`}
            </Button>
          </div>
        </div>

        {/* Image Preview */}
        <Dialog open={!!previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)}>
          <DialogContent className="max-w-[95vw]">
            <div className="flex items-center justify-between gap-4 px-1">
              <h2 className="text-lg font-semibold truncate flex-1 min-w-0">
                {previewDocument?.strFileName}
                {previewDocument?.strFileType && `.${previewDocument.strFileType.toLowerCase()}`}
              </h2>
              <button
                className="h-8 w-8 shrink-0 rounded-md transition-colors flex items-center cursor-pointer justify-center"
                onClick={() => setPreviewDocument(null)}
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-center items-center max-h-[70vh] overflow-auto bg-muted/30 rounded-md">
              {previewDocument?.strFilePath ? (
                isImageFile(previewDocument) ? (
                  <img
                    src={getImagePath(previewDocument.strFilePath)}
                    alt={previewDocument.strFileName}
                    className="max-h-[65vh] max-w-full rounded-md"
                  />
                ) : isPdfFile(previewDocument) ? (
                  <iframe
                    src={`${getImagePath(previewDocument.strFilePath)}#toolbar=1&navpanes=0&scrollbar=1`}
                    title={previewDocument.strFileName}
                    className="w-full h-[65vh] rounded-md border-0"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">Preview not available.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
