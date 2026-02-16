import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Trash2, Upload, RotateCcw, ChevronDown } from "lucide-react";

import type { Document, DocumentUploadRequest } from "@/types/central/document";

import { Actions, SpecialModules, ModuleBase } from "@/lib/permissions";

import { formatDate } from "@/lib/utils";

import {
  useDocuments,
  useUploadDocuments,
  useBulkDeleteDocuments,
  useBulkChangeDeleteStatus,
  useBulkMoveToFolder,
} from "@/hooks/api/central/use-documents";
import { useFolders, useFolder } from "@/hooks/api/central/use-folders";
import { useActiveDocumentModules } from "@/hooks/api/central/use-document-modules";
import { useTableLayout, useListPreferences } from "@/hooks/common";
import { useAuthContext } from "@/hooks/common/use-auth-context";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileIcon } from "@/components/ui/file-icons";
import { IndeterminateCheckbox } from "@/components/ui/IndeterminateCheckbox";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { WithPermission } from "@/components/ui/with-permission";

import {
  DocumentTable,
  type DocumentTableColumn,
} from "@/components/data-display/data-tables/CheckboxDataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";

import { AttachToEntityModal } from "@/components/modals/AttachToEntityModal";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";
import { AddToButton } from "@/pages/Central/document/components/AddToButton";
import { DocumentCard } from "@/pages/Central/document/components/DocumentCard";
import { TaskModal } from "@/pages/Task/components/task-modal/TaskModal";

export default function Document() {
  const [searchParams] = useSearchParams();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadDocuments, isPending: isUploading } =
    useUploadDocuments();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [emptyTrashDialogOpen, setEmptyTrashDialogOpen] =
    useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("");
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<string>("");
  const [attachDocumentIds, setAttachDocumentIds] = useState<string[]>([]);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [taskModalGUID, setTaskModalGUID] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState({
    fileType: false,
    moveToFolder: false,
    addToModule: false,
  });

  const defaultColumnOrder = [
    "select",
    "strFileName",
    "strFolderName",
    "uploadInfo",
    "associatedTo",
    "addToAction",
  ];

  const bulkDeleteDocumentsMutation = useBulkDeleteDocuments();
  const bulkChangeDeleteStatusMutation = useBulkChangeDeleteStatus();
  const bulkMoveToFolderMutation = useBulkMoveToFolder();
  const folderGUID = searchParams.get("strFolderGUID");
  const isDeleted = searchParams.get("bolIsDeleted") === "true";
  const isTaskModule = user?.strLastModuleName === "Task";

  const { data: foldersData } = useFolders(
    undefined,
    !isDeleted && dropdownOpen.moveToFolder
  );
  const { data: currentFolder } = useFolder(folderGUID || undefined);
  const { data: documentModulesData, isLoading: isLoadingModules } =
    useActiveDocumentModules(undefined, !isDeleted && dropdownOpen.addToModule);
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("document", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strFileName",
        direction: "asc",
      },
    });
  const {
    columnVisibility,
    toggleColumnVisibility,
    resetColumnVisibility,
    hasVisibleContentColumns,
    getAlwaysVisibleColumns,
    isTextWrapped,
    toggleTextWrapping,
    pinnedColumns,
    pinColumn,
    unpinColumn,
    resetPinnedColumns,
    columnWidths,
    setColumnWidths,
    resetAll,
  } = useTableLayout(
    "document",
    defaultColumnOrder,
    ["select", "addToAction"],
    {
      strFileName: true,
      strFolderName: true,
      uploadInfo: true,
      associatedTo: true,
    }
  );

  const [statusFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useDocuments({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy: sorting.columnKey || "strFileName",
    ascending: sorting.direction === "asc",
    search: debouncedSearch,
    strStatus: statusFilter,
    bolIsDeleted: isDeleted,
    strFolderGUID: folderGUID || undefined,
    strFileType:
      fileTypeFilter && fileTypeFilter !== "all" ? fileTypeFilter : undefined,
  });

  const documents = React.useMemo<Document[]>(() => {
    if (!data || !data.data.items) return [];
    return data.data.items as Document[];
  }, [data]);

  const documentModules = React.useMemo(() => {
    return documentModulesData && Array.isArray(documentModulesData)
      ? documentModulesData
      : [];
  }, [documentModulesData]);

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

  const fileTypeOptions = [
    { value: "all", label: "All" },
    { value: "images", label: "Images" },
    { value: "pdf", label: "PDF" },
    { value: "docs", label: "Docs" },
    { value: "sheets", label: "Sheets" },
  ];

  useEffect(() => {
    if (data) {
      updateResponseData({
        totalCount: data.data.totalCount || 0,
        totalPages: data.data.totalPages || 1,
      });
    }
  }, [data, updateResponseData]);

  // Queries are enabled only when dropdowns are open, consistent with approvals pages

  useEffect(() => {
    setSelectedRows({});
    setSelectAll(false);
    setIndeterminate(false);
  }, [isDeleted, folderGUID]);

  useEffect(() => {
    if (pinColumn && !pinnedColumns.includes("select")) {
      pinColumn("select");
    }
  }, [pinColumn, pinnedColumns]);

  const handleBulkDeleteDocuments = () => {
    if (selectedItemsCount > 0) {
      setDeleteDialogOpen(true);
    }
  };

  const getDeleteDialogText = () => {
    if (isDeleted) {
      return {
        title: "Delete Document Permanently",
        description:
          "Are you sure you want to permanently delete this document? This action cannot be undone.",
        confirmLabel: "Delete Permanently",
      };
    }
    return {
      title: "Delete Document",
      description:
        "Are you sure you want to move this document to trash? You can restore it later from the trash folder.",
      confirmLabel: "Move to Trash",
    };
  };

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setIndeterminate(false);
      setSelectAll(checked);

      if (checked) {
        const newSelectedRows: Record<string, boolean> = {};
        documents.forEach((doc) => {
          newSelectedRows[doc.strDocumentGUID] = true;
        });
        setSelectedRows(newSelectedRows);
      } else {
        setSelectedRows({});
      }
    },
    [documents]
  );

  const handleRowSelection = useCallback((documentId: string) => {
    setSelectedRows((prev) => ({
      ...prev,
      [documentId]: !prev[documentId],
    }));
  }, []);

  useEffect(() => {
    const selectedCount = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    ).length;

    if (documents.length > 0) {
      if (selectedCount === documents.length) {
        setSelectAll(true);
        setIndeterminate(false);
      } else if (selectedCount > 0) {
        setSelectAll(false);
        setIndeterminate(true);
      } else {
        setSelectAll(false);
        setIndeterminate(false);
      }
    }
  }, [documents, selectedRows]);

  const selectedItemsCount = React.useMemo(() => {
    return Object.keys(selectedRows).filter((id) => selectedRows[id]).length;
  }, [selectedRows]);

  const handleAddToEntity = useCallback(
    (_moduleGUID: string, moduleName: string, documentGUID?: string) => {
      const idsToAttach = documentGUID
        ? [documentGUID]
        : Object.keys(selectedRows).filter((id) => selectedRows[id]);

      if (idsToAttach.length > 0) {
        setAttachDocumentIds(idsToAttach);
        setSelectedEntityType(moduleName);
        setShowAttachModal(true);
      }
    },
    [selectedRows]
  );

  const columns = React.useMemo<DocumentTableColumn<Document>[]>(
    () => [
      {
        key: "select",
        width: "80px",
        header: (
          <div className="flex items-center justify-end h-full p-2">
            <IndeterminateCheckbox
              checked={selectAll}
              indeterminate={indeterminate}
              onCheckedChange={handleSelectAll}
              aria-label="Select all"
            />
          </div>
        ),
        cell: (document) => (
          <div className="flex items-center justify-start h-full p-2">
            <Checkbox
              checked={!!selectedRows[document.strDocumentGUID]}
              onCheckedChange={() =>
                handleRowSelection(document.strDocumentGUID)
              }
              aria-label={`Select ${document.strFileName}`}
            />
          </div>
        ),
        sortable: false,
      },
      {
        key: "strFileName",
        header: "Document Name",
        width: "180px",
        cell: (document) => (
          <div className="font-medium text-foreground flex items-center gap-2">
            <FileIcon
              fileType={document.strFileType}
              size={18}
              className="shrink-0"
            />
            <span>
              {document.strFileName}
              {document.strFileType
                ? `.${document.strFileType.toLowerCase()}`
                : ""}
            </span>
          </div>
        ),
        sortable: true,
      },

      {
        key: "strFolderName",
        header: "Folder Name",
        width: "180px",
        cell: (document) => (
          <div className="text-foreground">{document.strFolderName || "-"}</div>
        ),
        sortable: true,
      },
      {
        key: "associatedTo",
        header: "ASSOCIATED TO",
        width: "200px",
        cell: (document) => (
          <div className="py-1">
            {document.AssociatedTo && document.AssociatedTo.length > 0
              ? document.AssociatedTo.map((assoc, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center mb-1"
                  >
                    <span className="text-foreground text-sm">
                      {assoc.strEntityName}:
                    </span>
                    {assoc.strEntityValue ? (
                      isTaskModule &&
                      assoc.strURL &&
                      assoc.strURL.includes("/task/") ? (
                        <a
                          href={assoc.strURL}
                          className="text-blue-500 hover:text-blue-600 font-semibold text-sm ml-1"
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
                          className="text-blue-500 hover:text-blue-600 font-semibold text-sm ml-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {assoc.strEntityValue}
                        </a>
                      )
                    ) : (
                      <span className="ml-1 text-foreground">N/A</span>
                    )}
                  </div>
                ))
              : ""}
          </div>
        ),
        sortable: false,
      },
      {
        key: "uploadInfo",
        header: "Uploaded Info",
        width: "200px",
        cell: (document) => (
          <div className="flex flex-col gap-1">
            <div className="font-medium text-sm text-foreground">
              {document.strUploadedByName || "-"}
            </div>
            <div className="text-xs text-foreground">
              {formatDate(document.dtUploadedOn, true)}
            </div>
          </div>
        ),
        sortable: false,
      },
      ...(!isTaskModule
        ? [
            {
              key: "addToAction",
              header: "",
              width: "120px",
              cell: (document: Document) => (
                <AddToButton
                  document={document}
                  isDeleted={isDeleted}
                  modules={documentModules}
                  isLoadingModules={isLoadingModules}
                  onAddToEntity={handleAddToEntity}
                />
              ),
              sortable: false,
            },
          ]
        : []),
    ],
    [
      selectedRows,
      selectAll,
      indeterminate,
      handleSelectAll,
      handleRowSelection,
      isDeleted,
      documentModules,
      isLoadingModules,
      handleAddToEntity,
      isTaskModule,
      openTaskFromAssocUrl,
    ]
  );

  const confirmDeleteDocument = async () => {
    const selectedIds = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    );

    if (selectedIds.length === 0) return;

    if (isDeleted) {
      await bulkDeleteDocumentsMutation.mutateAsync(selectedIds);
    } else {
      await bulkChangeDeleteStatusMutation.mutateAsync({
        strDocumentGUIDs: selectedIds,
        bolIsDeleted: true,
      });
    }
    setDeleteDialogOpen(false);
    setSelectedRows({});
  };

  const handleRestoreDocuments = async () => {
    const selectedIds = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    );

    if (selectedIds.length === 0) return;

    await bulkChangeDeleteStatusMutation.mutateAsync({
      strDocumentGUIDs: selectedIds,
      bolIsDeleted: false,
    });
    setSelectedRows({});
  };

  const handleMoveToFolder = async (folderGUID: string) => {
    const selectedIds = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    );

    if (selectedIds.length === 0) return;

    await bulkMoveToFolderMutation.mutateAsync({
      strDocumentGUIDs: selectedIds,
      strFolderGUID: folderGUID,
    });
    setSelectedRows({});
  };

  const handleEmptyTrash = () => {
    setEmptyTrashDialogOpen(true);
  };

  const confirmEmptyTrash = async () => {
    if (documents.length > 0 && isDeleted) {
      const allDocumentIds = documents.map((doc) => doc.strDocumentGUID);

      if (allDocumentIds.length > 0) {
        await bulkDeleteDocumentsMutation.mutateAsync(allDocumentIds);
      }

      setEmptyTrashDialogOpen(false);
    }
  };

  const handleAddDocument = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const uploadData: DocumentUploadRequest = {
      files: Array.from(files),
      strFolderGUID: folderGUID || undefined,
    };

    await uploadDocuments(uploadData);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getPageTitle = () => {
    if (isDeleted) return "Deleted Documents";
    if (folderGUID && currentFolder)
      return `${currentFolder.strFolderName} - Folder Documents`;
    return "All Documents";
  };

  const getPageDescription = () => {
    if (isDeleted) return "View and manage documents in the trash";
    if (folderGUID && currentFolder)
      return `View documents in ${currentFolder.strFolderName} folder`;
    return "Manage and organize your document files";
  };

  const getPageIcon = () => {
    return isDeleted ? Trash2 : FileText;
  };

  return (
    <CustomContainer>
      <PageHeader
        title={getPageTitle()}
        description={getPageDescription()}
        icon={getPageIcon()}
        actions={
          <>
            {!isDeleted && !isTaskModule ? (
              <WithPermission
                module={SpecialModules.DOCUMENT}
                action={Actions.SAVE}
              >
                <Button
                  onClick={handleAddDocument}
                  disabled={isUploading}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                >
                  {isUploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Upload size={16} /> Upload File
                    </>
                  )}
                </Button>
              </WithPermission>
            ) : !isDeleted && isTaskModule ? null : (
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={handleEmptyTrash}
                disabled={
                  documents.length === 0 ||
                  bulkDeleteDocumentsMutation.isPending
                }
              >
                {bulkDeleteDocumentsMutation.isPending
                  ? "Deleting..."
                  : "Empty Trash"}
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6">
        <div className="flex flex-wrap gap-4 items-center mb-4 justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <SearchInput
              placeholder="Search documents..."
              onSearchChange={setDebouncedSearch}
              className="w-64"
            />

            <div className="w-44 h-10">
              <Select
                value={fileTypeFilter}
                onValueChange={setFileTypeFilter}
                open={dropdownOpen.fileType}
                onOpenChange={(open) =>
                  setDropdownOpen((prev) => ({ ...prev, fileType: open }))
                }
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Filter by file type" />
                </SelectTrigger>
                <SelectContent>
                  {fileTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isDeleted && (
              <div className="h-10 flex items-center">
                <DraggableColumnVisibility
                  columns={columns}
                  columnVisibility={columnVisibility}
                  toggleColumnVisibility={toggleColumnVisibility}
                  resetColumnVisibility={resetColumnVisibility}
                  hasVisibleContentColumns={hasVisibleContentColumns}
                  getAlwaysVisibleColumns={getAlwaysVisibleColumns}
                  isTextWrapped={isTextWrapped}
                  toggleTextWrapping={toggleTextWrapping}
                  pinnedColumns={pinnedColumns}
                  pinColumn={pinColumn}
                  unpinColumn={unpinColumn}
                  resetPinnedColumns={resetPinnedColumns}
                  onResetAll={resetAll}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-end">
            {!isDeleted && selectedItemsCount > 0 && (
              <div className="inline-block h-10" style={{ width: "100px" }}>
                <PreloadedSelect
                  options={(foldersData?.data?.items ?? []).map((folder) => ({
                    value: folder.strFolderGUID,
                    label: folder.strFolderName,
                  }))}
                  selectedValue=""
                  onChange={(folderGUID) => handleMoveToFolder(folderGUID)}
                  placeholder="Move to"
                  className="w-25"
                  clearable={false}
                  initialMessage="Select a folder"
                  onOpenChange={(isOpen) =>
                    setDropdownOpen((prev) => ({
                      ...prev,
                      moveToFolder: isOpen,
                    }))
                  }
                />
              </div>
            )}

            {!isDeleted && selectedItemsCount > 0 && (
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
                    className="h-10 px-3 bg-primary text-primary-foreground"
                    disabled={isLoadingModules}
                  >
                    {isLoadingModules ? "Loading..." : "Add to"}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {isLoadingModules ? (
                    <DropdownMenuItem disabled>
                      Loading modules...
                    </DropdownMenuItem>
                  ) : documentModules.length > 0 ? (
                    documentModules.map((module) => (
                      <DropdownMenuItem
                        key={module.strDocumentModuleGUID}
                        onClick={() =>
                          handleAddToEntity(
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

            {!isDeleted && selectedItemsCount > 0 && (
              <Button
                variant="destructive"
                className="h-10 "
                onClick={handleBulkDeleteDocuments}
              >
                <Trash2 size={12} className="mr-1" />({selectedItemsCount})
              </Button>
            )}

            {isDeleted && selectedItemsCount > 0 && (
              <Button
                variant="outline"
                className="h-10"
                onClick={handleRestoreDocuments}
              >
                <RotateCcw size={16} className="mr-2" /> Restore Selected (
                {selectedItemsCount})
              </Button>
            )}

            {isDeleted && selectedItemsCount > 0 && (
              <Button
                variant="outline"
                className="h-10 text-destructive"
                onClick={handleBulkDeleteDocuments}
              >
                Delete Selected ({selectedItemsCount})
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-md border border-border-color">
        {isLoading ? (
          <TableSkeleton
            columns={[
              { header: "", width: "80px" },
              { header: "FILE NAME", width: "250px" },
              { header: "FOLDER NAME", width: "180px" },
              { header: "UPLOADED INFO", width: "200px" },
              { header: "ASSOCIATED TO", width: "180px" },
            ]}
            pageSize={pagination.pageSize}
          />
        ) : (
          <DocumentTable
            columns={columns}
            data={documents}
            keyExtractor={(item) => item.strDocumentGUID}
            sortBy={sorting.columnKey || undefined}
            ascending={sorting.direction === "asc"}
            onSort={(column) =>
              setSorting({
                columnKey: column,
                direction:
                  sorting.columnKey === column && sorting.direction === "asc"
                    ? "desc"
                    : "asc",
              })
            }
            onRowClick={(document) => setSelectedDocument(document)}
            pagination={{
              pageNumber: pagination.pageNumber,
              pageSize: pagination.pageSize,
              totalCount: pagination.totalCount || 0,
              totalPages: pagination.totalPages || 0,
              onPageChange: (page) =>
                setPagination({ ...pagination, pageNumber: page }),
              onPageSizeChange: (size) =>
                setPagination({ ...pagination, pageSize: size, pageNumber: 1 }),
            }}
            pageSizeOptions={[5, 10, 20, 50]}
            columnVisibility={columnVisibility}
            alwaysVisibleColumns={getAlwaysVisibleColumns()}
            pinnedColumns={pinnedColumns}
            isTextWrapped={isTextWrapped}
            columnWidths={columnWidths}
            onColumnWidthsChange={setColumnWidths}
            maxHeight="calc(100vh - 350px)"
          />
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteDocument}
        title={getDeleteDialogText().title}
        description={getDeleteDialogText().description}
        confirmLabel={getDeleteDialogText().confirmLabel}
        isLoading={bulkDeleteDocumentsMutation.isPending}
      />

      <DeleteConfirmationDialog
        open={emptyTrashDialogOpen}
        onOpenChange={setEmptyTrashDialogOpen}
        onConfirm={confirmEmptyTrash}
        title="Empty Trash"
        description="Are you sure you want to permanently delete all documents in the trash? This action cannot be undone."
        confirmLabel="Empty Trash"
        isLoading={bulkDeleteDocumentsMutation.isPending}
      />

      {selectedDocument && (
        <DocumentCard
          documentId={selectedDocument.strDocumentGUID}
          onClose={() => setSelectedDocument(null)}
          onRename={() => setSelectedDocument(null)}
          folders={foldersData?.data?.items}
          documentModules={documentModules}
          isLoadingModules={isLoadingModules}
          onMoveToFolder={async (documentId, folderGUID) => {
            if (folderGUID && documentId) {
              await bulkMoveToFolderMutation.mutateAsync({
                strDocumentGUIDs: [documentId],
                strFolderGUID: folderGUID,
              });
            }
          }}
          onAddToEntity={(documentId, _moduleGUID, moduleName) => {
            handleAddToEntity(_moduleGUID, moduleName, documentId);
          }}
          isMovingToFolder={bulkMoveToFolderMutation.isPending}
          hideAddTo={isTaskModule}
        />
      )}

      <AttachToEntityModal
        open={showAttachModal}
        onOpenChange={(open) => {
          setShowAttachModal(open);
          if (!open) {
            setSelectedRows({});
          }
        }}
        entityType={selectedEntityType}
        documentIds={attachDocumentIds}
        documentCount={attachDocumentIds.length}
      />

      {showTaskModal && taskModalGUID && (
        <TaskModal
          open={showTaskModal}
          onOpenChange={setShowTaskModal}
          taskGUID={taskModalGUID}
          mode="edit"
          permissionModule={ModuleBase.MY_TASK}
        />
      )}
    </CustomContainer>
  );
}
