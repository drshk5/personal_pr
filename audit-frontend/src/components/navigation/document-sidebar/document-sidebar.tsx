import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { FolderItem } from "./folder-item";
import { DocumentItem } from "./document-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useDocumentMode } from "@/hooks/common/use-document-mode";
import { useNavigate, useLocation } from "react-router-dom";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
  useFolders,
  useCreateFolder,
  useDeleteFolder,
  useUpdateFolder,
} from "@/hooks/api/central/use-folders";

export function DocumentSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const { setDocMode, referrerPath, setReferrerPath } = useDocumentMode();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAddingFolder, setIsAddingFolder] = React.useState(false);
  const [isEditingFolder, setIsEditingFolder] = React.useState(false);
  const [editingFolderId, setEditingFolderId] = React.useState<string | null>(
    null
  );
  const [folderName, setFolderName] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [folderToDelete, setFolderToDelete] = React.useState<string | null>(
    null
  );

  const { data, isLoading } = useFolders(searchQuery || undefined);
  const folders = data?.data?.items;
  const createFolderMutation = useCreateFolder();
  const deleteFolderMutation = useDeleteFolder();
  const updateFolderMutation = useUpdateFolder();

  const handleBackClick = () => {
    setDocMode(false);

    if (
      referrerPath &&
      referrerPath !== "/" &&
      !referrerPath.includes("/document")
    ) {
      setReferrerPath(null); // Clear the referrer
      navigate(referrerPath, { replace: true });
    } else {
      navigate(-1);
    }
  };

  const handleAddFolder = () => {
    setIsAddingFolder(true);
    setFolderName("");
  };

  const handleEditFolder = (id: string, name: string) => {
    setEditingFolderId(id);
    setFolderName(name);
    setIsEditingFolder(true);
  };

  const handleDeleteFolder = (id: string) => {
    setFolderToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFolder = () => {
    if (folderToDelete) {
      deleteFolderMutation.mutate(folderToDelete);
      setDeleteDialogOpen(false);
      setFolderToDelete(null);
    }
  };

  const handleFolderClick = (strFolderGUID: string) => {
    navigate(`/document?strFolderGUID=${strFolderGUID}`);
  };

  const handleSaveFolder = () => {
    if (!folderName.trim()) {
      handleCancelFolderOperation();
      return;
    }

    if (isAddingFolder) {
      createFolderMutation.mutate({ strFolderName: folderName });
    } else if (isEditingFolder && editingFolderId) {
      const currentFolder = folders?.find(
        (folder) => folder.strFolderGUID === editingFolderId
      );

      if (currentFolder && currentFolder.strFolderName !== folderName) {
        updateFolderMutation.mutate({
          id: editingFolderId,
          data: { strFolderName: folderName },
        });
      }
    }

    setIsAddingFolder(false);
    setIsEditingFolder(false);
    setEditingFolderId(null);
    setFolderName("");
  };

  const handleCancelFolderOperation = () => {
    setIsAddingFolder(false);
    setIsEditingFolder(false);
    setEditingFolderId(null);
    setFolderName("");
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleBackClick}
            title="Go back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">Documents</h2>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Folders..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col gap-1 px-2">
          <div className="mt-2">
            <DocumentItem
              label="All Documents"
              isActive={
                location.pathname === "/document" && location.search === ""
              }
              onClick={() => navigate("/document")}
            />
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center px-2 mb-1">
              <h3 className="text-sm font-medium text-muted-foreground">
                FOLDERS
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleAddFolder}
                title="Add folder"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {isAddingFolder && (
              <div className="px-2 mb-2">
                <Input
                  placeholder="Folder name..."
                  className="h-8"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onBlur={handleSaveFolder}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveFolder();
                    } else if (e.key === "Escape") {
                      handleCancelFolderOperation();
                    }
                  }}
                  autoFocus
                />
              </div>
            )}{" "}
            {isLoading ? (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                Loading folders...
              </div>
            ) : folders && folders.length > 0 ? (
              folders
                .filter((folder) =>
                  folder.strFolderName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
                )
                .map((folder) => (
                  <FolderItem
                    key={folder.strFolderGUID}
                    label={folder.strFolderName}
                    count={folder.intDocumentCount}
                    isActive={
                      location.search ===
                      `?strFolderGUID=${folder.strFolderGUID}`
                    }
                    isEditing={
                      isEditingFolder &&
                      editingFolderId === folder.strFolderGUID
                    }
                    onClick={() => handleFolderClick(folder.strFolderGUID)}
                    onEdit={() =>
                      handleEditFolder(
                        folder.strFolderGUID,
                        folder.strFolderName
                      )
                    }
                    onDelete={() => handleDeleteFolder(folder.strFolderGUID)}
                    onSave={(newName) => {
                      if (editingFolderId && newName !== folder.strFolderName) {
                        updateFolderMutation.mutate({
                          id: editingFolderId,
                          data: { strFolderName: newName },
                        });
                      }
                      setIsEditingFolder(false);
                      setEditingFolderId(null);
                      setFolderName("");
                    }}
                    onCancel={handleCancelFolderOperation}
                  />
                ))
            ) : (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                No folders found
              </div>
            )}
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter className="px-4 pb-4">
        <Button
          variant="outline"
          className="w-full text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          onClick={() => navigate("/document?bolIsDeleted=true")}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Trash
        </Button>
      </SidebarFooter>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteFolder}
        title="Delete Folder"
        description="Are you sure you want to delete this folder? This action cannot be undone and any documents within this folder may become inaccessible."
        confirmLabel="Delete Folder"
        isLoading={deleteFolderMutation.isPending}
      />
    </Sidebar>
  );
}
