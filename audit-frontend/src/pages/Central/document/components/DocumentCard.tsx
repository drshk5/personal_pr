import { useState, useRef, useEffect, useCallback } from "react";
import { Settings, Pencil, Trash2 } from "lucide-react";

import {
  useDocument,
  useUpdateDocument,
  useDeleteDocument,
} from "@/hooks/api/central/use-documents";

import { Actions, SpecialModules, ModuleBase } from "@/lib/permissions";

import type { DocumentModule } from "@/types/central/document-module";

import {
  formatDate,
  formatFileSize,
  getImagePath,
  downloadBlob,
} from "@/lib/utils";

import { WithPermission } from "@/components/ui/with-permission";
import { LargeFileIcon } from "@/components/ui/file-icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LazyImage } from "@/components/ui/lazy-image";
import { AttachmentPreviewDialog } from "@/components/ui/attachments/AttachmentPreviewDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { TaskModal } from "@/pages/Task/components/task-modal/TaskModal";

interface DocumentCardProps {
  documentId: string;
  onClose?: () => void;
  onRename?: (documentId: string, newName: string) => void;
  folders?: Array<{ strFolderGUID: string; strFolderName: string }>;
  documentModules?: DocumentModule[];
  isLoadingModules?: boolean;
  onMoveToFolder?: (documentId: string, folderGUID: string) => void;
  onAddToEntity?: (
    documentId: string,
    moduleGUID: string,
    moduleName: string
  ) => void;
  isMovingToFolder?: boolean;
  hideAddTo?: boolean;
}

export const DocumentCard = ({
  documentId,
  onClose,
  onRename,
  folders = [],
  documentModules = [],
  isLoadingModules = false,
  onMoveToFolder,
  onAddToEntity,
  isMovingToFolder = false,
  hideAddTo = false,
}: DocumentCardProps) => {
  const { data: document, isLoading, error } = useDocument(documentId);
  const { user } = useAuthContext();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [open, setOpen] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [allowBlur, setAllowBlur] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalGUID, setTaskModalGUID] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState({
    moveToFolder: false,
    addToModule: false,
    moreActions: false,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const isTaskModule = user?.strLastModuleName === "Task";

  const isImageFile = (fileType: string | undefined) => {
    if (!fileType) return false;
    const lowerType = fileType.toLowerCase();
    return (
      lowerType.includes("image") ||
      lowerType === "png" ||
      lowerType === "jpg" ||
      lowerType === "jpeg" ||
      lowerType === "gif"
    );
  };

  const isPdfFile = (fileType: string | undefined) => {
    if (!fileType) return false;
    const lowerType = fileType.toLowerCase();
    return lowerType === "pdf" || lowerType.includes("pdf");
  };

  const handleMoveToFolder = (folderGUID: string) => {
    if (folderGUID && documentId && onMoveToFolder) {
      onMoveToFolder(documentId, folderGUID);
    }
  };

  const handleAddTo = (moduleGUID: string, moduleName: string) => {
    if (onAddToEntity) {
      onAddToEntity(documentId, moduleGUID, moduleName);
    }
  };

  const handleDownload = async () => {
    if (!document || !document.strFilePath) return;

    const fileUrl = getImagePath(document.strFilePath);
    if (!fileUrl) return;

    const response = await fetch(fileUrl);
    const blob = await response.blob();

    const fileExtension =
      document.strFileType?.split("/").pop()?.toLowerCase() || "";
    const fileName = fileExtension
      ? `${document.strFileName}.${fileExtension}`
      : document.strFileName;

    downloadBlob(blob, fileName);
  };

  const handleDeleteDocument = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteDocument.mutate(documentId, {
      onSuccess: () => {
        handleSheetClose();
      },
    });
  };

  const handleSheetClose = useCallback(() => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isRenaming && onClose) {
        handleSheetClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, isRenaming, handleSheetClose]);

  useEffect(() => {
    if (document) {
      setNewFileName(document.strFileName);
      setIsRenaming(false);
      setUserInteracted(false);
      setAllowBlur(true);
    }
  }, [document]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const openTaskFromAssocUrl = useCallback((url: string) => {
    try {
      const parsed = new URL(url, window.location.origin);
      const parts = parsed.pathname.split("/").filter(Boolean);
      const guid = parts[parts.length - 1];
      if (guid) {
        setTaskModalGUID(guid);
        setShowTaskModal(true);
      }
    } catch {
      const parts = url.split("/").filter(Boolean);
      const guid = parts[parts.length - 1];
      if (guid) {
        setTaskModalGUID(guid);
        setShowTaskModal(true);
      }
    }
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        className="w-100 sm:w-135 flex flex-col h-full overflow-hidden"
        onCloseAutoFocus={() => handleSheetClose()}
      >
        <div className="flex items-center justify-between bg-card text-white p-2 relative">
          <div className="flex items-center gap-3">
            {folders && folders.length > 0 && (
              <div className="inline-block h-10" style={{ width: "160px" }}>
                <PreloadedSelect
                  options={folders.map((folder) => ({
                    value: folder.strFolderGUID,
                    label: folder.strFolderName,
                  }))}
                  selectedValue={""}
                  onChange={(folderGUID) => handleMoveToFolder(folderGUID)}
                  placeholder="Move to folder..."
                  className="w-full"
                  clearable={false}
                  initialMessage="Select a folder"
                  isLoading={isMovingToFolder}
                  disabled={isMovingToFolder}
                  queryKey={["folders"]}
                  onOpenChange={(isOpen) =>
                    setDropdownOpen((prev) => ({
                      ...prev,
                      moveToFolder: isOpen,
                    }))
                  }
                />
              </div>
            )}

            {!hideAddTo && (
              <DropdownMenu
                open={dropdownOpen.addToModule}
                onOpenChange={(isOpen) =>
                  setDropdownOpen((prev) => ({
                    ...prev,
                    addToModule: isOpen,
                  }))
                }
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 px-3 bg-primary text-primary-foreground"
                    disabled={isLoadingModules}
                  >
                    {isLoadingModules ? "Loading..." : "Add to"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {isLoadingModules ? (
                    <DropdownMenuItem disabled>
                      Loading modules...
                    </DropdownMenuItem>
                  ) : documentModules.length > 0 ? (
                    documentModules.map((module) => (
                      <DropdownMenuItem
                        key={module.strDocumentModuleGUID}
                        onClick={() =>
                          handleAddTo(
                            module.strDocumentModuleGUID,
                            module.strModuleName
                          )
                        }
                      >
                        {module.strModuleName}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      No modules available
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {document && (
              <DropdownMenu
                open={dropdownOpen.moreActions}
                onOpenChange={(isOpen) =>
                  setDropdownOpen((prev) => ({
                    ...prev,
                    moreActions: isOpen,
                  }))
                }
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8  dark:text-white text-black bg-transparent hover:bg-white/10"
                    aria-label="Settings"
                    title="Settings"
                  >
                    <Settings size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-30">
                  <DropdownMenuItem
                    onClick={() => {
                      setAllowBlur(false);
                      setNewFileName(document.strFileName);
                      setIsRenaming(true);
                      setTimeout(() => {
                        if (inputRef.current) {
                          inputRef.current.focus();
                          inputRef.current.select();
                          setTimeout(() => setAllowBlur(true), 300);
                        }
                      }, 200);
                    }}
                  >
                    <span className="mr-3">Rename</span>
                    <Pencil className="ml-2 h-4 w-4" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleDeleteDocument}
                  >
                    <span className="mr-5">Delete</span>
                    <Trash2 className="ml-2 h-4 w-4" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="p-4 text-center">
            <p className="py-4 text-foreground">Loading document details...</p>
          </div>
        )}

        {(error || !document) && (
          <div className="p-4 text-center">
            <p className="py-4 text-destructive">
              Failed to load document details
            </p>
          </div>
        )}

        {document && (
          <div className="flex flex-col h-[calc(100%-60px)]">
            <div className="flex-1 p-4 text-center overflow-y-auto">
              <div className="flex justify-center py-8 mt-10">
                {isImageFile(document.strFileType) ? (
                  <button
                    onClick={() => setShowImagePreview(true)}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    title="Click to view full image"
                  >
                    <LazyImage
                      src={
                        document.strFilePath
                          ? getImagePath(document.strFilePath) || ""
                          : ""
                      }
                      alt={document.strFileName}
                      className="max-h-52 text-foreground rounded-md"
                      containerClassName="max-h-52"
                      loading="lazy"
                    />
                  </button>
                ) : isPdfFile(document.strFileType) ? (
                  <button
                    onClick={() => setShowPdfPreview(true)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    title="Click to view PDF"
                  >
                    <LargeFileIcon fileType={document.strFileType} />
                  </button>
                ) : (
                  <LargeFileIcon fileType={document.strFileType} />
                )}
              </div>

              {isRenaming ? (
                <div className="mb-3 flex items-center justify-center">
                  <div className="relative w-full max-w-xs">
                    <input
                      ref={inputRef}
                      type="text"
                      className="text-xl text-center bg-transparent border-b border-primary focus:outline-none focus:border-b-2 text-foreground px-2 py-1 w-full pr-16"
                      value={newFileName}
                      onFocus={() => setUserInteracted(true)}
                      onClick={() => setUserInteracted(true)}
                      onChange={(e) => {
                        setUserInteracted(true);
                        setNewFileName(e.target.value);
                      }}
                      onBlur={() => {
                        if (!allowBlur) return;

                        if (!userInteracted && isRenaming) {
                          return;
                        }

                        if (
                          newFileName.trim() !== "" &&
                          newFileName !== document.strFileName
                        ) {
                          updateDocument.mutate(
                            {
                              id: documentId,
                              data: { strFileName: newFileName.trim() },
                            },
                            {
                              onSuccess: () => {
                                onRename?.(documentId, newFileName.trim());
                                setOpen(true);
                              },
                            }
                          );
                        } else {
                          setNewFileName(document.strFileName);
                        }
                        setIsRenaming(false);
                        setUserInteracted(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        } else if (e.key === "Escape") {
                          setNewFileName(document.strFileName);
                          setIsRenaming(false);
                          setUserInteracted(false);
                        }
                      }}
                    />
                    {document.strFileType && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pr-2">
                        .{document.strFileType.split("/").pop()?.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <h2 className="text-xl font-medium text-foreground">
                    {document.strFileName}
                    {document.strFileType && (
                      <span className="text-sm text-muted-foreground ml-1">
                        .{document.strFileType.split("/").pop()?.toLowerCase()}
                      </span>
                    )}
                  </h2>
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-6">
                {formatFileSize(document.strFileSize)}{" "}
                {formatDate(document.dtUploadedOn, true)}
              </p>

              {document.strFolderName && (
                <div className="border-t border-border-color pt-3 mb-3">
                  <h3 className="text-sm uppercase text-muted-foreground mb-1">
                    FOLDER:
                  </h3>
                  <p className="text-sm font-medium text-foreground">
                    {document.strFolderName}
                  </p>
                </div>
              )}

              <div className="border-t border-border-color pt-3 mb-4">
                <h3 className="text-sm text-left text-muted-foreground mb-3">
                  ASSOCIATED TO :
                </h3>
                <div className="text-sm text-foreground">
                  {document.AssociatedTo && document.AssociatedTo.length > 0 ? (
                    document.AssociatedTo.map((assoc, index) => (
                      <div
                        key={assoc.strDocumentAssociationGUID || index}
                        className="mb-2 flex justify-between items-center w-full"
                      >
                        <span className="text-muted-foreground text-base">
                          {assoc.strEntityName}:
                        </span>
                        {assoc.strEntityValue ? (
                          isTaskModule && assoc.strURL?.includes("/task/") ? (
                            <a
                              href={assoc.strURL}
                              className="text-blue-500 font-semibold text-base hover:text-blue-600"
                              onClick={(e) => {
                                e.preventDefault();
                                openTaskFromAssocUrl(assoc.strURL!);
                              }}
                            >
                              {assoc.strEntityValue}
                            </a>
                          ) : (
                            <a
                              href={assoc.strURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 font-semibold text-base hover:text-blue-600"
                            >
                              {assoc.strEntityValue}
                            </a>
                          )
                        ) : (
                          <span className="text-base">N/A</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      No associations
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border-color p-4 mt-auto">
              <WithPermission
                module={SpecialModules.DOCUMENT}
                action={Actions.EXPORT}
              >
                <Button className="w-full" onClick={handleDownload}>
                  Download
                </Button>
              </WithPermission>
            </div>

            <DeleteConfirmationDialog
              open={showDeleteConfirm}
              onOpenChange={setShowDeleteConfirm}
              onConfirm={confirmDelete}
              title="Delete Document"
              description={`Are you sure you want to delete "${document.strFileName}"? This action cannot be undone.`}
              isLoading={deleteDocument.isPending}
            />
          </div>
        )}
      </SheetContent>

      {/* PDF Preview Dialog */}
      {document && isPdfFile(document.strFileType) && (
        <AttachmentPreviewDialog
          files={[
            {
              url:
                (document.strFilePath
                  ? getImagePath(document.strFilePath)
                  : "") || "",
              name: `${document.strFileName}.${document.strFileType?.split("/").pop()?.toLowerCase() || "pdf"}`,
              type: document.strFileType || "pdf",
              isImage: false,
              isPdf: true,
              size: formatFileSize(document.strFileSize),
            },
          ]}
          currentIndex={showPdfPreview ? 0 : null}
          onClose={() => setShowPdfPreview(false)}
          onIndexChange={() => {}}
        />
      )}

      {/* Image Preview Dialog */}
      {document && isImageFile(document.strFileType) && (
        <AttachmentPreviewDialog
          files={[
            {
              url:
                (document.strFilePath
                  ? getImagePath(document.strFilePath)
                  : "") || "",
              name: `${document.strFileName}.${document.strFileType?.split("/").pop()?.toLowerCase() || ""}`,
              type: document.strFileType || "",
              isImage: true,
              isPdf: false,
              size: formatFileSize(document.strFileSize),
            },
          ]}
          currentIndex={showImagePreview ? 0 : null}
          onClose={() => setShowImagePreview(false)}
          onIndexChange={() => {}}
        />
      )}

      {showTaskModal && taskModalGUID && (
        <TaskModal
          open={showTaskModal}
          onOpenChange={setShowTaskModal}
          taskGUID={taskModalGUID}
          mode="edit"
          permissionModule={ModuleBase.MY_TASK}
        />
      )}
    </Sheet>
  );
};
